import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authRegisterSchema, authLoginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { authRateLimit } from "./rateLimiter";
import { logAudit } from "./auditMiddleware";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const user = await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Check if user has any organizations, if not create a default one
  const userOrgs = await storage.getUserOrganizations(user.id);
  if (userOrgs.length === 0) {
    // Create default organization for new user
    const orgName = `${claims["first_name"] || "User"}'s Organization`;
    const defaultOrg = await storage.createOrganization({
      name: orgName,
    });

    // Add user as ORG_ADMIN
    await storage.createMembership({
      userId: user.id,
      organizationId: defaultOrg.id,
      role: 'ORG_ADMIN',
    });
  }
}

// Hash password helper
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password helper
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Create user with email/password and auto onboarding
export async function createUserWithOnboarding(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
) {
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const user = await storage.upsertUser({
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
  });

  // Auto-create organization (same logic as OIDC)
  const userOrgs = await storage.getUserOrganizations(user.id);
  if (userOrgs.length === 0) {
    const orgName = `${firstName || "User"}'s Organization`;
    const defaultOrg = await storage.createOrganization({
      name: orgName,
    });

    await storage.createMembership({
      userId: user.id,
      organizationId: defaultOrg.id,
      role: 'ORG_ADMIN',
    });
  }

  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy for email/password authentication
  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Credenziali non valide' });
        }

        // Check if user has password (could be OAuth-only user)
        if (!user.password) {
          return done(null, false, { message: 'Credenziali non valide' });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Credenziali non valide' });
        }

        // Success - return user (following existing session structure)
        const userSession = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        return done(null, userSession);
      } catch (error) {
        return done(error);
      }
    }
  ));

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Email/password registration endpoint
  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    try {
      // Validate request body with Zod
      const validationResult = authRegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors;
        return res.status(400).json({ 
          message: errors[0]?.message || "Dati di registrazione non validi",
          errors: errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { email, password, firstName, lastName } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Don't reveal account existence - log server-side but return success
        console.log(`Registration attempt for existing email: ${email}`);
        return res.status(201).json({ 
          message: "Se l'email è valida, riceverai le istruzioni per completare la registrazione" 
        });
      }

      // Create user with automatic onboarding
      const user = await createUserWithOnboarding(email, password, firstName, lastName);

      const userOrgs = await storage.getUserOrganizations(user.id);
      if (userOrgs.length > 0) {
        const ip = (req as any).auditContext?.ipAddress || req.ip || 'unknown';
        const userAgent = (req as any).auditContext?.userAgent || req.headers['user-agent'] || '';
        
        await logAudit(
          userOrgs[0].id,
          user.id,
          'register',
          'user',
          user.id,
          ip,
          userAgent,
          { email: user.email, method: 'email_password' }
        );
      }

      // Regenerate session ID to prevent fixation, then login the user
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante la sicurezza della sessione" });
        }
        
        req.login({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }, (err) => {
          if (err) {
            return res.status(500).json({ message: "Errore durante il login automatico" });
          }
          
          res.status(201).json({ 
            message: "Account creato con successo",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          });
        });
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Email/password login endpoint
  app.post("/api/auth/login", authRateLimit, (req, res, next) => {
    try {
      // Validate request body with Zod
      const validationResult = authLoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors;
        return res.status(400).json({ 
          message: errors[0]?.message || "Dati di login non validi",
          errors: errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      // Proceed with passport authentication
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Errore del server" });
        }
        
        if (!user) {
          return res.status(401).json({ 
            message: info?.message || "Credenziali non valide" 
          });
        }

        // Regenerate session ID to prevent fixation, then login the user
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).json({ message: "Errore durante la sicurezza della sessione" });
          }
          
          req.login(user, async (err) => {
            if (err) {
              return res.status(500).json({ message: "Errore durante il login" });
            }
            
            const userOrgs = await storage.getUserOrganizations(user.id);
            if (userOrgs.length > 0) {
              const ip = (req as any).auditContext?.ipAddress || req.ip || 'unknown';
              const userAgent = (req as any).auditContext?.userAgent || req.headers['user-agent'] || '';
              
              await logAudit(
                userOrgs[0].id,
                user.id,
                'login',
                'user',
                user.id,
                ip,
                userAgent,
                { email: user.email, method: 'email_password' }
              );
            }
            
            res.json({ 
              message: "Login effettuato con successo",
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            });
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login validation error:", error);
      res.status(500).json({ message: "Errore durante la validazione" });
    }
  });
}

// Middleware to extract and validate current organization from header
export const withCurrentOrganization: RequestHandler = async (req: any, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id || req.user.claims?.sub;
  const orgHeader = req.headers['x-organization-id'];

  if (orgHeader && typeof orgHeader === 'string') {
    try {
      // Verify user has access to this organization
      const membership = await storage.getUserMembership(userId, orgHeader);
      if (membership) {
        req.currentOrganization = orgHeader;
        req.currentMembership = membership;
        return next();
      }
    } catch (error) {
      console.error("Error validating organization:", error);
    }
  }

  // Fallback: use user's first organization
  try {
    const userOrgs = await storage.getUserOrganizations(userId);
    if (userOrgs.length > 0) {
      req.currentOrganization = userOrgs[0].id;
      req.currentMembership = userOrgs[0].membership;
      return next();
    }
  } catch (error) {
    console.error("Error fetching user organizations:", error);
  }

  return res.status(403).json({ message: "No organization access" });
};

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For email/password users, we just check if they're logged in (no token refresh needed)
  if (!user.expires_at) {
    return next();
  }

  // For OAuth users, check token expiration and refresh if needed
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
