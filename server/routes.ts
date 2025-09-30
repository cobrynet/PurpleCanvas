import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, withCurrentOrganization } from "./replitAuth";
import { db } from "./db";
import { organizations } from "@shared/schema";
import { count } from "drizzle-orm";
import { 
  insertOrganizationSchema,
  insertMembershipSchema,
  insertCampaignSchema,
  insertLeadSchema,
  insertOpportunitySchema,
  insertMarketingTaskSchema,
  insertBusinessGoalSchema,
  insertOfflineActivitySchema,
  insertConversationSchema,
  insertConversationMessageSchema,
  insertAgentPresenceSchema,
  userSettingsSchema,
  organizationSettingsSchema
} from "@shared/schema";
import { assets } from "@shared/schema";

// Helper function to get user ID from both OAuth and email/password sessions
function getUserId(user: any): string {
  return user.id || user.claims?.sub;
}

// Social media post functions would be imported here if they existed
// For now, using placeholder functions
// Social media publishing functions moved here to avoid import issues
let mockPosts: any[] = [];

// Real social media publishing functions
async function publishToMeta(connection: any, postContent: string, imageUrl?: string) {
  try {
    const accessToken = connection.accessTokenEnc; // In production, encrypt this
    
    // Prepare the post data
    const postData: any = {
      message: postContent,
      access_token: accessToken,
    };
    
    // Add image if provided
    if (imageUrl) {
      postData.link = imageUrl;
    }
    
    // Publish to Facebook Page
    const response = await fetch(`https://graph.facebook.com/v18.0/${connection.accountId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(postData),
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      postId: result.id,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      postId: null,
      error: error.message || 'Failed to publish to Meta',
    };
  }
}

async function publishToLinkedIn(connection: any, postContent: string, imageUrl?: string) {
  try {
    const accessToken = connection.accessTokenEnc; // In production, encrypt this
    
    // Get user profile to get the URN
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/(id:~)', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    const profile = await profileResponse.json();
    const userUrn = profile.id;
    
    // Prepare the post data
    const postData = {
      author: `urn:li:person:${userUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postContent,
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
          ...(imageUrl && {
            media: [
              {
                status: 'READY',
                description: {
                  text: 'Image'
                },
                media: imageUrl,
                title: {
                  text: 'Shared Image'
                }
              }
            ]
          })
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };
    
    // Publish to LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });
    
    const result = await response.json();
    
    if (response.status !== 201) {
      throw new Error(result.message || 'Failed to publish to LinkedIn');
    }
    
    return {
      success: true,
      postId: result.id,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      postId: null,
      error: error.message || 'Failed to publish to LinkedIn',
    };
  }
}

async function createTaskForUnconnectedPlatform(organizationId: string, userId: string, platform: string, postContent: string, imageUrl?: string) {
  try {
    // Create a task for manual posting with automation rules applied
    const task = await storage.createMarketingTaskWithAutomation({
      organizationId,
      title: `Pubblica su ${platform}`,
      type: 'SOCIAL_PUBLISHING',
      assigneeId: userId,
      status: 'BACKLOG' as const,
      priority: 'P2' as const,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
    });

    // Create a reminder notification - using correct schema fields
    await storage.createNotification({
      organizationId,
      userId: userId,
      title: `Promemoria: Pubblica su ${platform}`,
      message: `Non dimenticare di pubblicare il contenuto su ${platform}:\n\n${postContent}${imageUrl ? `\n\nImmagine: ${imageUrl}` : ''}`,
      type: 'INFO' as const,
      isRead: false,
    });

    return {
      success: true,
      taskId: task.id,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      taskId: null,
      error: error.message || 'Failed to create fallback task',
    };
  }
}

async function publishSocialPost(req: any, res: any) {
  try {
    const { id } = req.params;
    const organizationId = req.currentOrganization;
    const userId = getUserId(req.user);

    // Find the post
    const postIndex = mockPosts.findIndex(post => post.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    const post = mockPosts[postIndex];

    // Check if post is already published
    if (post.status === "published") {
      return res.status(400).json({
        success: false,
        error: "Post is already published"
      });
    }

    // Get active social connections for the organization
    const connections = await storage.getSocialConnections(organizationId);
    const activeConnections = connections.filter(conn => conn.status === 'active');

    // Map platform names to provider names
    const platformToProvider: { [key: string]: string } = {
      'facebook': 'meta',
      'instagram': 'meta',
      'linkedin': 'linkedin',
      'meta': 'meta'
    };

    const publishResults = [];
    const taskResults = [];

    // Process each platform
    for (const platform of post.platforms) {
      const provider = platformToProvider[platform.toLowerCase()];
      
      // Find active connection for this provider
      const connection = activeConnections.find(conn => conn.provider === provider);
      
      if (connection) {
        // Try to publish to the real provider
        let result;
        
        if (provider === 'meta') {
          result = await publishToMeta(connection, post.content, post.imageUrl);
        } else if (provider === 'linkedin') {
          result = await publishToLinkedIn(connection, post.content, post.imageUrl);
        } else {
          result = {
            success: false,
            postId: null,
            error: `Unsupported provider: ${provider}`
          };
        }
        
        publishResults.push({
          platform,
          success: result.success,
          error: result.error,
          postId: result.postId,
          method: 'api'
        });
      } else {
        // No connection available, create a task and reminder
        const taskResult = await createTaskForUnconnectedPlatform(
          organizationId,
          userId,
          platform,
          post.content,
          post.imageUrl
        );
        
        publishResults.push({
          platform,
          success: false,
          error: `No ${platform} connection available`,
          postId: null,
          method: 'task',
          taskId: taskResult.taskId
        });
        
        if (taskResult.success) {
          taskResults.push({
            platform,
            taskId: taskResult.taskId,
            message: `Task created for manual posting to ${platform}`
          });
        }
      }
    }

    // Determine overall success
    const hasAnySuccess = publishResults.some((result: any) => result.success);
    const hasTaskCreated = taskResults.length > 0;
    
    // Update the post
    mockPosts[postIndex] = {
      ...post,
      status: hasAnySuccess ? "published" : (hasTaskCreated ? "pending_manual" : "failed"),
      publishedAt: hasAnySuccess ? new Date().toISOString() : null,
      publishResults,
      taskResults,
      updatedAt: new Date().toISOString(),
      // Generate some initial engagement for successfully published posts
      engagement: hasAnySuccess ? {
        likes: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 15)
      } : post.engagement
    };

    res.json({
      success: hasAnySuccess || hasTaskCreated,
      data: mockPosts[postIndex],
      publishResults,
      taskResults,
      message: hasTaskCreated 
        ? `Published to ${publishResults.filter(r => r.success).length} platforms, created ${taskResults.length} tasks for manual posting`
        : hasAnySuccess 
          ? `Successfully published to ${publishResults.filter(r => r.success).length} platforms`
          : "Failed to publish to any platform"
    });

  } catch (error) {
    console.error('Error publishing social post:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

async function getPublishStatus(req: any, res: any) {
  try {
    const { id } = req.params;

    // Find the post
    const post = mockPosts.find(post => post.id === id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    // Return publish status and analytics
    const status = {
      postId: post.id,
      status: post.status,
      publishedAt: post.publishedAt,
      publishResults: post.publishResults || [],
      engagement: post.engagement || { likes: 0, shares: 0, comments: 0 },
      platforms: post.platforms
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching publish status:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

// Mock AI function to generate initial tasks based on goals
async function generateInitialTasks(goalData: any, userId: string): Promise<any[]> {
  const tasks = [];
  const orgId = goalData.organizationId;
  
  // Base tasks always generated
  const baseTasks = [
    {
      title: "Definisci Buyer Personas dettagliate",
      type: "STRATEGY",
      subtype: "RESEARCH",
      priority: "P1" as const,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      title: "Analisi competitiva del settore",
      type: "STRATEGY", 
      subtype: "RESEARCH",
      priority: "P2" as const,
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    }
  ];
  
  // Sector-specific tasks
  if (goalData.sector) {
    if (goalData.sector.includes("Tecnologia") || goalData.sector.includes("Software")) {
      baseTasks.push({
        title: "Ottimizza SEO per keyword tecniche del settore",
        type: "CONTENT",
        subtype: "SEO",
        priority: "P2" as const,
        dueAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      });
    }
    
    if (goalData.sector.includes("E-commerce")) {
      baseTasks.push({
        title: "Configura Google Shopping e Meta Catalog",
        type: "ADV",
        subtype: "SETUP",
        priority: "P1" as const,
        dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
    }
  }
  
  // Channel-specific tasks
  if (goalData.preferredChannels?.length > 0) {
    if (goalData.preferredChannels.some((ch: string) => ch.includes("Social Media"))) {
      baseTasks.push({
        title: "Crea piano editoriale Instagram/Facebook",
        type: "CONTENT",
        subtype: "PLANNING",
        priority: "P1" as const,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    if (goalData.preferredChannels.some((ch: string) => ch.includes("Email Marketing"))) {
      baseTasks.push({
        title: "Imposta automazioni email per nurturing",
        type: "EMAIL",
        subtype: "AUTOMATION",
        priority: "P2" as const,
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }
    
    if (goalData.preferredChannels.some((ch: string) => ch.includes("Google Ads"))) {
      baseTasks.push({
        title: "Configura campagne Google Ads iniziali",
        type: "ADV",
        subtype: "PPC",
        priority: "P1" as const,
        dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
    }
  }
  
  // Budget-based tasks
  if (goalData.marketingBudget) {
    if (goalData.marketingBudget >= 50000) {
      baseTasks.push({
        title: "Pianifica strategia multi-canale integrata",
        type: "STRATEGY",
        subtype: "PLANNING",
        priority: "P1" as const,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } else if (goalData.marketingBudget >= 10000) {
      baseTasks.push({
        title: "Ottimizza ROI su 2-3 canali principali",
        type: "STRATEGY",
        subtype: "OPTIMIZATION",
        priority: "P1" as const,
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }
  }
  
  // Create tasks in database
  for (const taskData of baseTasks) {
    try {
      const task = await storage.createMarketingTaskWithAutomation({
        organizationId: orgId,
        title: taskData.title,
        type: taskData.type,
        subtype: taskData.subtype,
        assigneeId: userId,
        status: "BACKLOG" as const,
        priority: taskData.priority,
        dueAt: taskData.dueAt,
      });
      tasks.push(task);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }
  
  return tasks;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Stripe (only if API key is available)
  let stripe: Stripe | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const result = await db.select({ count: count() }).from(organizations);
      const organizationCount = result[0]?.count || 0;
      
      res.json({
        ok: true,
        count: organizationCount
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        ok: false,
        count: 0
      });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);
      
      // Prevent caching to ensure fresh user data after login
      res.set('Cache-Control', 'no-store');
      res.json({ ...user, organizations });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgData = insertOrganizationSchema.parse(req.body);
      
      const organization = await storage.createOrganization(orgData);
      
      // Create membership for the creator as ORG_ADMIN
      await storage.createMembership({
        userId,
        organizationId: organization.id,
        role: 'ORG_ADMIN',
      });
      
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organization', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const organization = await storage.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Goals routes
  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const { useAI, ...bodyWithoutUseAI } = req.body;
      const goalData = insertBusinessGoalSchema.parse({
        ...bodyWithoutUseAI,
        createdByUserId: userId,
      });
      
      // Verify user has access to the organization
      const membership = await storage.getUserMembership(userId, goalData.organizationId);
      if (!membership) {
        return res.status(403).json({ message: "No access to this organization" });
      }
      
      // Create the goal
      const goal = await storage.createBusinessGoal(goalData);
      
      let planId: string;
      
      // If useAI is true, use AI to generate the plan
      if (useAI && process.env.OPENAI_API_KEY) {
        try {
          // Import OpenAI and generate AI plan
          const { default: OpenAI } = await import('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          // Build context for AI
          const context = {
            objectives: goal.objectives,
            periodicity: goal.periodicity,
            totalBudget: goal.totalBudget,
            salesPipeline: goal.salesPipeline,
            fairs: goal.fairs,
            digitalChannels: goal.digitalChannels,
            adInvestments: goal.adInvestments,
            geoArea: goal.geoArea,
            sector: goal.sector,
            preferredChannels: goal.preferredChannels,
          };

          const systemPrompt = `Sei un planner esperto di marketing e sales B2B. 
Genera un piano annuale/semestrale/quadrimestrale coerente e dettagliato basato sugli obiettivi aziendali forniti.

Il piano deve includere:
- organicPostsPerWeek (2-4 post): frequenza di pubblicazione organica sui social
- channels: lista dei canali social da utilizzare
- hasSocialAds: true se il budget include investimenti pubblicitari social
- fairsBudgetCents: budget allocato per fiere ed eventi (in centesimi)
- hasFairs: true se sono previste fiere o eventi
- salesCadence: cadenza delle attività commerciali (es: "email+call", "call only", "email only")
- targetLeadsPerMonth: numero target di lead da generare al mese

Rispondi SOLO in formato JSON valido seguendo ESATTAMENTE questa struttura:
{
  "periodicity": "ANNUALE" | "SEMESTRALE" | "QUADRIMESTRALE",
  "durationDays": number (giorni di durata del piano),
  "marketing": {
    "organicPostsPerWeek": number (2-4),
    "channels": string[] (es: ["LinkedIn", "Instagram"]),
    "hasSocialAds": boolean
  },
  "offline": {
    "fairsBudgetCents": number (in centesimi),
    "hasFairs": boolean
  },
  "sales": {
    "cadence": string (es: "email+call"),
    "targetLeadsPerMonth": number
  },
  "notes": string (note e raccomandazioni strategiche)
}`;

          const userPrompt = `Genera un piano marketing e sales B2B basato su questi dati:

Obiettivi: ${context.objectives}
Periodicità: ${context.periodicity}
Budget totale: €${(context.totalBudget / 100).toFixed(2)}
Pipeline commerciale: ${context.salesPipeline || 'Non specificato'}
Fiere ed eventi: ${context.fairs || 'Non specificati'}
Canali digitali: ${context.digitalChannels || 'Non specificati'}
Investimenti pubblicitari: ${context.adInvestments || 'Non specificati'}
Area geografica: ${context.geoArea || 'Non specificata'}
Settore: ${context.sector || 'Non specificato'}
Canali preferiti: ${context.preferredChannels?.join(', ') || 'Non specificati'}

Genera un piano coerente e realistico in formato JSON.`;

          // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
          });

          const aiResponseContent = response.choices[0].message.content;
          if (!aiResponseContent) {
            throw new Error("Empty response from OpenAI");
          }

          const aiGeneratedSpec = JSON.parse(aiResponseContent);
          const { goalPlanSpecSchema } = await import('@shared/schema');
          const validatedSpec = goalPlanSpecSchema.parse(aiGeneratedSpec);

          // Create GoalPlan with AI-generated spec
          const plan = await storage.createOrUpdateGoalPlan({
            goalId: goal.id,
            organizationId: goalData.organizationId,
            spec: validatedSpec,
            generatedAt: new Date(),
          });
          
          planId = plan.id;
        } catch (aiError) {
          console.error("AI generation failed, falling back to manual plan:", aiError);
          // Fall back to manual plan generation if AI fails
          const manualPlan = await createManualPlan(goal, goalData, req.body.allocations);
          planId = manualPlan.id;
        }
      } else {
        // Use manual plan generation (original logic)
        const manualPlan = await createManualPlan(goal, goalData, req.body.allocations);
        planId = manualPlan.id;
      }
      
      const response = { ok: true, goalId: goal.id, planId };
      console.log("[POST /api/goals] Sending response:", JSON.stringify(response));
      res.json(response);
    } catch (error) {
      console.error("Error creating goals:", error);
      res.status(500).json({ message: "Failed to create goals" });
    }
  });

  // Helper function for manual plan creation
  async function createManualPlan(goal: any, goalData: any, allocations: any[] | undefined) {
    const durationDays = ({
      ANNUALE: 365,
      SEMESTRALE: 180,
      QUADRIMESTRALE: 120
    } as const)[goalData.periodicity as 'ANNUALE' | 'SEMESTRALE' | 'QUADRIMESTRALE'] || 365;

    let channels: string[] = [];
    if (goalData.preferredChannels && goalData.preferredChannels.length > 0) {
      channels = goalData.preferredChannels;
    } else if (goalData.digitalChannels) {
      const text = goalData.digitalChannels.toLowerCase();
      if (text.includes('instagram')) channels.push('Instagram');
      if (text.includes('facebook')) channels.push('Facebook');
      if (text.includes('linkedin')) channels.push('LinkedIn');
      if (text.includes('twitter') || text.includes('x.com')) channels.push('Twitter');
    }

    let hasSocialAds = false;
    let fairsBudgetCents = 0;
    if (allocations && allocations.length > 0) {
      const socialAdsAlloc = allocations.find((a: any) => a.category === 'SOCIAL_ADS');
      hasSocialAds = !!socialAdsAlloc;
      
      const fairsAlloc = allocations.find((a: any) => a.category === 'FIERE');
      fairsBudgetCents = fairsAlloc?.amount || 0;
    } else if (goalData.adInvestments) {
      hasSocialAds = goalData.adInvestments.toLowerCase().includes('social') || 
                     goalData.adInvestments.toLowerCase().includes('facebook') ||
                     goalData.adInvestments.toLowerCase().includes('instagram');
    }

    const hasFairs = !!goalData.fairs || fairsBudgetCents > 0;

    const spec = {
      periodicity: goalData.periodicity,
      durationDays,
      marketing: {
        organicPostsPerWeek: channels.length > 0 ? 3 : 2,
        channels,
        hasSocialAds
      },
      offline: {
        fairsBudgetCents,
        hasFairs
      },
      sales: {
        cadence: "email+call",
        targetLeadsPerMonth: 40
      },
      notes: goalData.objectives || ""
    };

    return await storage.createOrUpdateGoalPlan({
      goalId: goal.id,
      organizationId: goalData.organizationId,
      spec,
      generatedAt: new Date(),
    });
  }

  app.get('/api/goals/active', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const goal = await storage.getActiveGoal(orgId);
      res.json(goal || null);
    } catch (error) {
      console.error("Error fetching active goal:", error);
      res.status(500).json({ message: "Failed to fetch active goal" });
    }
  });

  app.get('/api/goals', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const goals = await storage.getBusinessGoals(orgId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.delete('/api/goals/:goalId', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      const { goalId } = req.params;
      
      // Get the goal to verify ownership
      const goals = await storage.getBusinessGoals(orgId);
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.organizationId !== orgId) {
        return res.status(403).json({ message: "No access to this goal" });
      }
      
      // Delete the goal (this should cascade to related tables)
      await storage.deleteBusinessGoal(goalId);
      
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  app.post('/api/goals/:goalId/generate-tasks', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgId = req.currentOrganization;
      const { goalId } = req.params;
      const { overwrite = false } = req.body;

      // Get the GoalPlan
      const goalPlan = await storage.getGoalPlanByGoalId(goalId);
      if (!goalPlan) {
        return res.status(404).json({ message: "GoalPlan not found for this goal" });
      }

      // Verify multi-tenant security: goalPlan must belong to current organization
      if (goalPlan.organizationId !== orgId) {
        return res.status(403).json({ message: "No access to this goal" });
      }

      // Check if tasks already exist for this goal
      const existingTaskCount = await storage.getTaskCountByGoalId(goalId);
      if (existingTaskCount > 0 && !overwrite) {
        return res.json({ 
          ok: true, 
          skipped: true, 
          createdCount: 0,
          modules: {
            marketing: 0,
            marketing_adv: 0,
            marketing_offline: 0,
            crm: 0,
          }
        });
      }

      // If overwrite, delete existing tasks
      if (existingTaskCount > 0 && overwrite) {
        await storage.deleteTasksByGoalId(goalId);
      }

      // Generate tasks from spec
      const spec = goalPlan.spec as any;
      const tasksToCreate: any[] = [];

      const startDate = new Date();

      // Marketing - Organico: post settimanali
      if (spec.marketing?.channels && spec.marketing.channels.length > 0) {
        const postsPerWeek = spec.marketing.organicPostsPerWeek || 2;
        const durationDays = spec.durationDays || 365;
        const weeks = Math.max(1, Math.floor(durationDays / 7));
        
        // Distribuzione: lun/mer/ven per 3 post, lun/giov per 2 post
        const daysOfWeek = postsPerWeek === 3 ? [1, 3, 5] : [1, 4]; // 1=Mon, 3=Wed, 4=Thu, 5=Fri
        
        for (let week = 0; week < weeks; week++) {
          for (const targetDow of daysOfWeek) {
            const startDow = startDate.getDay();
            const daysUntil = (7 + targetDow - startDow) % 7 || 7; // Next occurrence of targetDow
            const dueDate = new Date(startDate);
            dueDate.setDate(startDate.getDate() + daysUntil + (week * 7));
            dueDate.setHours(10, 0, 0, 0); // 10:00 AM
            
            for (const channel of spec.marketing.channels) {
              tasksToCreate.push({
                organizationId: goalPlan.organizationId,
                goalId: goalId,
                module: 'marketing',
                title: `Post ${channel} settimana ${week + 1}`,
                type: 'CONTENT',
                subtype: 'POST',
                assigneeId: userId,
                status: 'BACKLOG',
                priority: 'P2',
                dueAt: dueDate,
                metadata: { channel, week: week + 1, dayOfWeek: targetDow },
              });
            }
          }
        }
      }

      // Marketing - ADV: task mensili se hasSocialAds
      if (spec.marketing?.hasSocialAds) {
        const durationDays = spec.durationDays || 365;
        const months = Math.ceil(durationDays / 30);
        
        for (let month = 0; month < months; month++) {
          const setupDate = new Date(startDate);
          setupDate.setMonth(startDate.getMonth() + month);
          setupDate.setDate(1);
          setupDate.setHours(10, 0, 0, 0);
          
          // Ensure setupDate is in the future
          if (setupDate <= startDate) {
            setupDate.setMonth(setupDate.getMonth() + 1);
          }
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'marketing_adv',
            title: `Setup/ottimizzazione campagne mese ${month + 1}`,
            type: 'ADV',
            subtype: 'SETUP',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P1',
            dueAt: setupDate,
            metadata: { month: month + 1 },
          });
          
          const reportDate = new Date(setupDate);
          reportDate.setDate(28);
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'marketing_adv',
            title: `Report mensile mese ${month + 1}`,
            type: 'ADV',
            subtype: 'REPORT',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P2',
            dueAt: reportDate,
            metadata: { month: month + 1 },
          });
        }
      }

      // Marketing - Offline: task per fiere
      if (spec.offline?.hasFairs || spec.offline?.fairsBudgetCents > 0) {
        const durationDays = spec.durationDays || 365;
        const quarters = Math.ceil(durationDays / 90);
        
        for (let quarter = 1; quarter <= quarters; quarter++) {
          const quarterStartDate = new Date(startDate);
          quarterStartDate.setMonth(startDate.getMonth() + (quarter - 1) * 3);
          
          const planDate = new Date(quarterStartDate);
          planDate.setDate(1);
          planDate.setHours(10, 0, 0, 0);
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'marketing_offline',
            title: `Pianifica stand fiera Q${quarter}`,
            type: 'OFFLINE',
            subtype: 'PLANNING',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P1',
            dueAt: planDate,
            metadata: { quarter },
          });
          
          const materialsDate = new Date(planDate);
          materialsDate.setDate(15);
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'marketing_offline',
            title: `Materiali stampa fiera Q${quarter}`,
            type: 'OFFLINE',
            subtype: 'MATERIALS',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P2',
            dueAt: materialsDate,
            metadata: { quarter },
          });
          
          const leadCaptureDate = new Date(planDate);
          leadCaptureDate.setMonth(planDate.getMonth() + 1);
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'marketing_offline',
            title: `Lead capture flow fiera Q${quarter}`,
            type: 'OFFLINE',
            subtype: 'LEAD_CAPTURE',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P1',
            dueAt: leadCaptureDate,
            metadata: { quarter },
          });
        }
      }

      // Commerciale: task prospezione, follow-up, demo
      const durationDaysCommercial = spec.durationDays || 365;
      const months = Math.ceil(durationDaysCommercial / 30);
      for (let month = 1; month <= months; month++) {
        const monthStartDate = new Date(startDate);
        monthStartDate.setMonth(startDate.getMonth() + month - 1);
        monthStartDate.setDate(1);
        monthStartDate.setHours(10, 0, 0, 0);
        
        tasksToCreate.push({
          organizationId: goalPlan.organizationId,
          goalId: goalId,
          module: 'crm',
          title: `Prospezione mese ${month}`,
          type: 'PROSPECTING',
          subtype: 'OUTREACH',
          assigneeId: userId,
          status: 'BACKLOG',
          priority: 'P1',
          dueAt: monthStartDate,
          metadata: { month },
        });
        
        // Follow-up settimanali (4 per mese)
        for (let week = 1; week <= 4; week++) {
          const followupDate = new Date(monthStartDate);
          followupDate.setDate(monthStartDate.getDate() + (week - 1) * 7);
          
          tasksToCreate.push({
            organizationId: goalPlan.organizationId,
            goalId: goalId,
            module: 'crm',
            title: `Follow-up settimanale M${month}W${week}`,
            type: 'FOLLOWUP',
            subtype: 'EMAIL',
            assigneeId: userId,
            status: 'BACKLOG',
            priority: 'P2',
            dueAt: followupDate,
            metadata: { month, week },
          });
        }
        
        const demoDate = new Date(monthStartDate);
        demoDate.setDate(15);
        
        tasksToCreate.push({
          organizationId: goalPlan.organizationId,
          goalId: goalId,
          module: 'crm',
          title: `Demo/Call mese ${month}`,
          type: 'MEETING',
          subtype: 'DEMO',
          assigneeId: userId,
          status: 'BACKLOG',
          priority: 'P1',
          dueAt: demoDate,
          metadata: { month },
        });
      }

      // Save all tasks
      const createdTasks = await Promise.all(
        tasksToCreate.map(task => storage.createMarketingTask(task))
      );

      // Count by module
      const modules = {
        marketing: createdTasks.filter(t => t.module === 'marketing').length,
        marketing_adv: createdTasks.filter(t => t.module === 'marketing_adv').length,
        marketing_offline: createdTasks.filter(t => t.module === 'marketing_offline').length,
        crm: createdTasks.filter(t => t.module === 'crm').length,
      };

      res.json({ 
        ok: true, 
        createdCount: createdTasks.length,
        modules
      });
    } catch (error) {
      console.error("Error generating tasks:", error);
      res.status(500).json({ message: "Failed to generate tasks" });
    }
  });

  // AI-powered goal plan generation
  app.post('/api/goals/:goalId/ai-plan', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      const { goalId } = req.params;

      // Get the goal
      const goals = await storage.getBusinessGoals(orgId);
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Verify multi-tenant security
      if (goal.organizationId !== orgId) {
        return res.status(403).json({ message: "No access to this goal" });
      }

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // Import OpenAI
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build context for AI
      const context = {
        objectives: goal.objectives,
        periodicity: goal.periodicity,
        totalBudget: goal.totalBudget,
        salesPipeline: goal.salesPipeline,
        fairs: goal.fairs,
        digitalChannels: goal.digitalChannels,
        adInvestments: goal.adInvestments,
        geoArea: goal.geoArea,
        sector: goal.sector,
        preferredChannels: goal.preferredChannels,
      };

      // System prompt for AI
      const systemPrompt = `Sei un planner esperto di marketing e sales B2B. 
Genera un piano annuale/semestrale/quadrimestrale coerente e dettagliato basato sugli obiettivi aziendali forniti.

Il piano deve includere:
- organicPostsPerWeek (2-4 post): frequenza di pubblicazione organica sui social
- channels: lista dei canali social da utilizzare
- hasSocialAds: true se il budget include investimenti pubblicitari social
- fairsBudgetCents: budget allocato per fiere ed eventi (in centesimi)
- hasFairs: true se sono previste fiere o eventi
- salesCadence: cadenza delle attività commerciali (es: "email+call", "call only", "email only")
- targetLeadsPerMonth: numero target di lead da generare al mese
- campaign milestones: obiettivi intermedi e milestone del piano
- report mensili: frequenza dei report di monitoraggio

Rispondi SOLO in formato JSON valido seguendo ESATTAMENTE questa struttura:
{
  "periodicity": "ANNUALE" | "SEMESTRALE" | "QUADRIMESTRALE",
  "durationDays": number (giorni di durata del piano),
  "marketing": {
    "organicPostsPerWeek": number (2-4),
    "channels": string[] (es: ["LinkedIn", "Instagram"]),
    "hasSocialAds": boolean
  },
  "offline": {
    "fairsBudgetCents": number (in centesimi),
    "hasFairs": boolean
  },
  "sales": {
    "cadence": string (es: "email+call"),
    "targetLeadsPerMonth": number
  },
  "notes": string (note e raccomandazioni strategiche)
}`;

      const userPrompt = `Genera un piano marketing e sales B2B basato su questi dati:

Obiettivi: ${context.objectives}
Periodicità: ${context.periodicity}
Budget totale: €${(context.totalBudget / 100).toFixed(2)}
Pipeline commerciale: ${context.salesPipeline || 'Non specificato'}
Fiere ed eventi: ${context.fairs || 'Non specificati'}
Canali digitali: ${context.digitalChannels || 'Non specificati'}
Investimenti pubblicitari: ${context.adInvestments || 'Non specificati'}
Area geografica: ${context.geoArea || 'Non specificata'}
Settore: ${context.sector || 'Non specificato'}
Canali preferiti: ${context.preferredChannels?.join(', ') || 'Non specificati'}

Genera un piano coerente e realistico in formato JSON.`;

      // Call OpenAI
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const aiResponseContent = response.choices[0].message.content;
      if (!aiResponseContent) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse and validate the JSON response
      const aiGeneratedSpec = JSON.parse(aiResponseContent);
      
      // Import schema for validation
      const { goalPlanSpecSchema } = await import('@shared/schema');
      const validatedSpec = goalPlanSpecSchema.parse(aiGeneratedSpec);

      // Get existing plan to increment version
      const existingPlan = await storage.getGoalPlanByGoalId(goalId);
      const newVersion = existingPlan ? (existingPlan.version || 1) + 1 : 1;

      // Update or create GoalPlan with AI-generated spec
      const plan = await storage.createOrUpdateGoalPlan({
        goalId: goal.id,
        organizationId: goal.organizationId,
        spec: validatedSpec,
        generatedAt: new Date(),
        version: newVersion,
      });

      res.json({ ok: true, planId: plan.id, spec: validatedSpec });
    } catch (error: any) {
      console.error("Error generating AI plan:", error);
      
      // Handle specific errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid AI response format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to generate AI plan",
        error: error.message 
      });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard-stats', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const stats = await storage.getDashboardStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent activity
  app.get('/api/recent-activity', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const activities = await storage.getRecentActivity(orgId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Upcoming deadlines
  app.get('/api/upcoming-deadlines', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const deadlines = await storage.getUpcomingDeadlines(orgId);
      res.json(deadlines);
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      res.status(500).json({ message: "Failed to fetch upcoming deadlines" });
    }
  });

  // Campaign routes
  app.post('/api/campaigns', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        organizationId: orgId,
      });
      
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const campaigns = await storage.getCampaigns(orgId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Marketing ADV Campaigns - using current organization
  app.get('/api/marketing/campaigns', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Filter campaigns by type ADV or MIXED
      const allCampaigns = await storage.getCampaigns(orgId);
      const advCampaigns = allCampaigns.filter(c => c.type === 'ADV' || c.type === 'MIXED');
      
      res.json(advCampaigns);
    } catch (error) {
      console.error("Error fetching ADV campaigns:", error);
      res.status(500).json({ message: "Failed to fetch ADV campaigns" });
    }
  });

  app.post('/api/marketing/campaigns', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      const userId = getUserId(req.user);
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Ensure it's an ADV campaign
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        organizationId: orgId,
        type: req.body.type || 'ADV', // Default to ADV
      });
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Create a linked marketing task if requested
      if (req.body.createTask) {
        const taskData = {
          organizationId: orgId,
          campaignId: campaign.id,
          title: `Gestione Campagna ADV: ${campaign.name}`,
          type: 'campaign_management',
          subtype: 'adv_setup',
          assigneeId: userId,
          status: 'BACKLOG' as const,
          priority: campaign.priority || 'P2', // Default priority, will be adjusted by automation rules
          dueAt: campaign.startAt ? new Date(new Date(campaign.startAt).getTime() - 7 * 24 * 60 * 60 * 1000) : null, // 7 days before start
        };
        
        await storage.createMarketingTaskWithAutomation(taskData);
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating ADV campaign:", error);
      res.status(500).json({ message: "Failed to create ADV campaign" });
    }
  });

  app.patch('/api/marketing/campaigns/:id', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate campaign exists and belongs to organization
      const existingCampaign = await storage.getCampaign(campaignId, orgId);
      if (!existingCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Parse and validate updates using the same schema as creation
      const updates = insertCampaignSchema.omit({ organizationId: true, type: true }).parse(req.body);
      const updatedCampaign = await storage.updateCampaign(campaignId, orgId, updates);
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating ADV campaign:", error);
      res.status(500).json({ message: "Failed to update ADV campaign" });
    }
  });

  // Lead routes
  app.post('/api/leads', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'SALES'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const leadData = insertLeadSchema.parse({
        ...req.body,
        organizationId: orgId,
        ownerId: userId,
      });
      
      const lead = await storage.createLead(leadData);
      
      // Create automated follow-up task based on organization settings
      const followUpTaskData = {
        organizationId: orgId,
        leadId: lead.id,
        title: `Follow-up Lead: ${lead.firstName} ${lead.lastName}`,
        type: 'lead_management',
        subtype: 'lead_followup',
        assigneeId: userId,
        status: 'BACKLOG' as const,
        priority: 'P2' as const, // Will be adjusted by automation rules
      };
      
      await storage.createMarketingTaskWithAutomation(followUpTaskData);
      
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.get('/api/leads', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const leads = await storage.getLeads(orgId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Opportunity routes
  app.post('/api/opportunities', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'SALES'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const opportunityData = insertOpportunitySchema.parse({
        ...req.body,
        organizationId: orgId,
        ownerId: userId,
      });
      
      const opportunity = await storage.createOpportunity(opportunityData);
      
      // Create automated reminder task based on organization settings
      const reminderTaskData = {
        organizationId: orgId,
        opportunityId: opportunity.id,
        title: `Opportunity Review: ${opportunity.title}`,
        type: 'opportunity_management',
        subtype: 'opportunity_reminder',
        assigneeId: userId,
        status: 'BACKLOG' as const,
        priority: 'P2' as const, // Will be adjusted by automation rules
        dueAt: opportunity.closeDate ? new Date(opportunity.closeDate) : null,
      };
      
      await storage.createMarketingTaskWithAutomation(reminderTaskData);
      
      res.json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.get('/api/opportunities', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const opportunities = await storage.getOpportunities(orgId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  // Task routes
  app.post('/api/tasks', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const taskData = insertMarketingTaskSchema.parse({
        ...req.body,
        organizationId: orgId,
      });
      
      const task = await storage.createMarketingTaskWithAutomation(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const tasks = await storage.getMarketingTasks(orgId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Marketing Offline Activity routes
  app.post('/api/marketing/offline', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      // Only SUPER_ADMIN, ORG_ADMIN and MARKETER can create offline activities
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const activityData = insertOfflineActivitySchema.parse({
        ...req.body,
        organizationId: orgId,
        createdByUserId: userId,
      });
      
      const activity = await storage.createOfflineActivity(activityData);
      
      // Automatically create a linked marketing task
      const taskTitle = `Gestione attività offline: ${activity.title}`;
      
      // Create task with automation rules applied based on organization settings
      const taskData = {
        organizationId: orgId,
        title: taskTitle,
        type: 'marketing_offline',
        subtype: activity.type.toLowerCase(),
        assigneeId: userId,
        status: 'BACKLOG' as const,
        priority: 'P2' as const, // Default priority, will be adjusted by automation rules
        dueAt: activity.activityDate,
      };
      
      const task = await storage.createMarketingTaskWithAutomation(taskData);
      
      // Update the activity with the task ID
      await storage.updateOfflineActivity(activity.id, orgId, { taskId: task.id });
      
      res.json({ activity: { ...activity, taskId: task.id }, task });
    } catch (error) {
      console.error("Error creating offline activity:", error);
      res.status(500).json({ message: "Failed to create offline activity" });
    }
  });

  app.get('/api/marketing/offline', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const orgId = req.currentOrganization;
      
      const activities = await storage.getOfflineActivities(orgId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching offline activities:", error);
      res.status(500).json({ message: "Failed to fetch offline activities" });
    }
  });

  app.patch('/api/marketing/offline/:id', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const { id } = req.params;
      const orgId = req.currentOrganization;
      const membership = req.currentMembership;
      
      // Only SUPER_ADMIN, ORG_ADMIN and MARKETER can update offline activities
      if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Validate update data - only allow specific fields to be updated
      const updateSchema = insertOfflineActivitySchema.partial().pick({
        title: true,
        type: true,
        activityDate: true,
        budget: true,
        description: true,
        assetIds: true
      });
      
      const updateData = updateSchema.parse(req.body);
      
      const updatedActivity = await storage.updateOfflineActivity(id, orgId, updateData);
      
      if (!updatedActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating offline activity:", error);
      res.status(500).json({ message: "Failed to update offline activity" });
    }
  });

  // Private object serving endpoint for uploaded assets
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const objectPath = req.path; // This includes "/objects/" prefix
      
      // Find the asset by object path to check authorization
      const asset = await storage.getAssetByObjectPath(objectPath);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      // Verify user has access to the asset's organization
      const userOrgs = await storage.getUserOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === asset.organizationId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this asset" });
      }
      
      const { ObjectStorageService, ObjectNotFoundError } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving private object:", error);
      if (error instanceof Error && error.name === 'ObjectNotFoundError') {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public object serving endpoint
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // AssetLink routes
  app.post('/api/assets/:id/link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assetId = req.params.id;
      const { relatedType, relatedId, organizationId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!relatedType || !relatedId || !organizationId) {
        return res.status(400).json({ 
          error: "Missing required fields: relatedType, relatedId, organizationId" 
        });
      }
      
      // Verify user has access to this organization
      const userOrgs = await storage.getUserOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }
      
      // Verify asset exists and belongs to the organization
      const asset = await storage.getAsset(assetId, organizationId);
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found or access denied' });
      }
      
      // Validate relatedType
      const validTypes = ['campaign', 'content', 'social_post', 'lead', 'opportunity'];
      if (!validTypes.includes(relatedType)) {
        return res.status(400).json({ 
          error: `Invalid relatedType. Must be one of: ${validTypes.join(', ')}` 
        });
      }
      
      // Create asset link
      const assetLinkData = {
        organizationId,
        assetId: asset.id,
        relatedType,
        relatedId
      };
      
      const assetLink = await storage.createAssetLink(assetLinkData);
      
      res.json({
        success: true,
        assetLink: {
          id: assetLink.id,
          assetId: assetLink.assetId,
          relatedType: assetLink.relatedType,
          relatedId: assetLink.relatedId,
          createdAt: assetLink.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating asset link:', error);
      res.status(500).json({ error: 'Failed to create asset link' });
    }
  });

  // Private object serving endpoint for uploaded assets
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const objectPath = req.path; // This includes "/objects/" prefix
      
      const { ObjectStorageService } = await import('./objectStorage');
      const { ObjectPermission } = await import('./objectAcl');
      const objectStorageService = new ObjectStorageService();
      
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: userId,
          requestedPermission: ObjectPermission.READ,
        });
        
        if (!canAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        await objectStorageService.downloadObject(objectFile, res);
      } catch (error: any) {
        console.error("Error serving object:", error);
        if (error.name === 'ObjectNotFoundError') {
          return res.status(404).json({ error: "Object not found" });
        }
        return res.status(500).json({ error: "Internal server error" });
      }
    } catch (error) {
      console.error("Error in object serving endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload routes
  app.post('/api/upload/init', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const { filename, fileType, fileSize } = req.body;
      const orgId = req.currentOrganization;
      const userId = getUserId(req.user);
      
      // Validate file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (fileSize && fileSize > maxFileSize) {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 50MB' });
      }
      
      // Basic filename sanitization
      const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '_') : 'file';
      
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      // Pass orgId and filename to create org-scoped path
      const { uploadUrl, publicUrl, objectPath } = await objectStorageService.getObjectEntityUploadURL(sanitizedFilename, orgId);
      
      // Prepare headers for Uppy/S3 upload
      const headers: Record<string, string> = {};
      if (fileType) {
        headers['Content-Type'] = fileType;
      }
      
      res.json({
        uploadUrl,
        objectPath,
        method: 'PUT',
        headers
      });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  app.post('/api/upload/complete', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const orgId = req.currentOrganization;
      const body = req.body;
      
      if (!body.objectPath) {
        return res.status(400).json({ error: 'Missing required field: objectPath' });
      }

      // Determine file type from mime type
      let assetType: 'IMAGE' | 'VIDEO' | 'DOC' | 'ARCHIVE' = 'DOC';
      if (body.mimeType?.startsWith('image/')) {
        assetType = 'IMAGE';
      } else if (body.mimeType?.startsWith('video/')) {
        assetType = 'VIDEO';
      } else if (body.mimeType?.includes('zip') || body.mimeType?.includes('rar') || body.mimeType?.includes('7z')) {
        assetType = 'ARCHIVE';
      }

      // Set ACL policy for uploaded object
      try {
        const { ObjectStorageService } = await import('./objectStorage');
        const objectStorageService = new ObjectStorageService();
        
        await objectStorageService.trySetObjectEntityAclPolicy(body.objectPath, {
          owner: userId,
          visibility: "private", // Private by default for user uploads
        });
      } catch (error) {
        console.error('Error setting ACL policy:', error);
        // Continue with asset creation even if ACL fails
      }

      // Create asset data with normalized object path for serving
      const assetData = {
        organizationId: orgId,
        type: assetType,
        mimeType: body.mimeType || 'application/octet-stream',
        sizeBytes: body.sizeBytes || 0,
        width: body.width || null,
        height: body.height || null,
        checksumSha256: body.checksumSha256 || `checksum-${Date.now()}`,
        url: body.objectPath, // Use object path for serving, not direct GCS URL
        thumbUrl: null,
        title: body.title || body.filename || 'Uploaded File',
        tags: body.tags || ['upload'],
        folder: body.folder || 'uploads',
        ownerId: userId
      };

      // Save asset using Drizzle
      const [asset] = await db.insert(assets).values(assetData).returning();

      res.json({
        success: true,
        asset: {
          id: asset.id,
          url: asset.url,
          type: asset.type,
          title: asset.title,
          createdAt: asset.createdAt
        }
      });
    } catch (error) {
      console.error('Error completing upload:', error);
      res.status(500).json({ error: 'Failed to complete upload' });
    }
  });

  // Social Posts routes
  // Placeholder social post routes - to be implemented later
  app.post('/api/social/posts', isAuthenticated, (req, res) => {
    res.status(501).json({ error: 'Social post creation not yet implemented' });
  });
  app.get('/api/social/posts', isAuthenticated, (req, res) => {
    res.json({ posts: mockPosts });
  });
  app.patch('/api/social/posts/:id/schedule', isAuthenticated, (req, res) => {
    res.status(501).json({ error: 'Social post scheduling not yet implemented' });
  });
  app.delete('/api/social/posts/:id/schedule', isAuthenticated, (req, res) => {
    res.status(501).json({ error: 'Social post unscheduling not yet implemented' });
  });
  app.post('/api/social/posts/:id/publish', isAuthenticated, withCurrentOrganization, publishSocialPost);
  app.get('/api/social/posts/:id/publish', isAuthenticated, withCurrentOrganization, getPublishStatus);

  // Marketplace routes
  app.get('/api/services', isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', isAuthenticated, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Conversation routes
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const { subject, channel } = req.body;
      
      const conversationData = {
        userId,
        status: 'OPEN' as const,
        channel: channel || 'WIDGET' as const,
        subject: subject || null,
        priority: 'P2' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate with schema
      const validData = insertConversationSchema.parse(conversationData);
      
      // Save to database
      const conversation = await storage.createConversation(validData);
      
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      
      // Get conversation from database
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user owns this conversation (security check)
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get messages for this conversation
      const messages = await storage.getConversationMessages(conversationId);
      
      res.json({
        ...conversation,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { content, senderType } = req.body;

      if (!content || !senderType) {
        return res.status(400).json({ message: "Content and senderType are required" });
      }

      // Verify conversation exists and user has access
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messageData = {
        conversationId,
        content,
        senderType,
        createdAt: new Date()
      };

      // Validate with schema
      const validData = insertConversationMessageSchema.parse(messageData);
      
      // Save to database
      const message = await storage.createConversationMessage(validData);
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/conversations/:id/escalate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      
      // Verify conversation exists and user has access
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update conversation to PENDING status (waiting for agent pickup)
      const updatedConversation = await storage.updateConversation(conversationId, {
        status: 'PENDING',
        escalatedAt: new Date(),
        priority: 'P1' // Escalated conversations get high priority
      });

      res.json({
        success: true,
        conversation: updatedConversation,
        message: 'Conversation has been escalated to specialist team'
      });
    } catch (error) {
      console.error("Error escalating conversation:", error);
      res.status(500).json({ message: "Failed to escalate conversation" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req.user);
      const { status } = req.query;
      
      // Get conversations for this user from database
      const conversations = await storage.getConversations(userId, status as string);
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Console API routes for operators (SUPER_ADMIN only)
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = getUserId(req.user);
      const userMemberships = await storage.getUserOrganizations(userId);
      
      const isSuperAdmin = userMemberships.some(org => 
        org.membership?.role === 'SUPER_ADMIN'
      );
      
      if (!isSuperAdmin) {
        return res.status(403).json({ message: "SUPER_ADMIN access required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking SUPER_ADMIN access:", error);
      res.status(500).json({ message: "Failed to verify access" });
    }
  };

  // Get conversations for console
  app.get('/api/console/conversations', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      
      // Get all conversations from database (not filtered by user for console view)
      const conversations = await storage.getConversations(undefined, status as string);
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching console conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get available agents
  app.get('/api/console/agents', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      // Get all available agents from database
      const agents = await storage.getAvailableAgents();
      
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Accept conversation
  app.post('/api/console/conversations/:id/accept', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const conversationId = req.params.id;
      const operatorId = (req.user as any)?.claims?.sub;
      
      // Assign conversation to the operator and update status
      const updatedConversation = await storage.assignConversation(conversationId, operatorId);
      
      if (!updatedConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Update agent presence (increment chat count)
      await storage.incrementAgentChatCount(operatorId);
      
      res.json({
        success: true,
        message: 'Conversation accepted successfully',
        conversation: updatedConversation
      });
    } catch (error) {
      console.error("Error accepting conversation:", error);
      res.status(500).json({ message: "Failed to accept conversation" });
    }
  });

  // Transfer conversation
  app.post('/api/console/conversations/:id/transfer', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { agentId } = req.body;
      const currentOperatorId = (req.user as any)?.claims?.sub;
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required for transfer" });
      }
      
      // Get current conversation to check the current assignee
      const currentConversation = await storage.getConversation(conversationId);
      if (!currentConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Transfer conversation to the new agent
      const updatedConversation = await storage.assignConversation(conversationId, agentId);
      
      // Update agent presence counts
      if (currentConversation.assigneeId) {
        await storage.decrementAgentChatCount(currentConversation.assigneeId);
      }
      await storage.incrementAgentChatCount(agentId);
      
      res.json({
        success: true,
        message: 'Conversation transferred successfully',
        conversation: updatedConversation
      });
    } catch (error) {
      console.error("Error transferring conversation:", error);
      res.status(500).json({ message: "Failed to transfer conversation" });
    }
  });

  // Close conversation
  app.post('/api/console/conversations/:id/close', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const conversationId = req.params.id;
      const operatorId = (req.user as any)?.claims?.sub;
      
      // Get current conversation to check the current assignee
      const currentConversation = await storage.getConversation(conversationId);
      if (!currentConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Close the conversation
      const closedConversation = await storage.closeConversation(conversationId);
      
      // Update agent presence (decrement chat count if assigned)
      if (currentConversation.assigneeId) {
        await storage.decrementAgentChatCount(currentConversation.assigneeId);
      }
      
      res.json({
        success: true,
        message: 'Conversation closed successfully',
        conversation: closedConversation
      });
    } catch (error) {
      console.error("Error closing conversation:", error);
      res.status(500).json({ message: "Failed to close conversation" });
    }
  });

  // Agent presence API routes
  app.put('/api/console/agents/presence', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const agentId = getUserId(req.user);
      const { status } = req.body;
      
      if (!status || !['ONLINE', 'AWAY', 'OFFLINE'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be ONLINE, AWAY, or OFFLINE" });
      }
      
      // Validate with schema
      const presenceData = { status };
      const validData = insertAgentPresenceSchema.partial().parse(presenceData);
      
      // Update agent presence
      const updatedPresence = await storage.updateAgentPresence(agentId, validData);
      
      res.json({
        success: true,
        presence: updatedPresence
      });
    } catch (error) {
      console.error("Error updating agent presence:", error);
      res.status(500).json({ message: "Failed to update agent presence" });
    }
  });

  app.get('/api/console/agents/presence', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const agentId = getUserId(req.user);
      
      // Get current agent presence
      const presence = await storage.getAgentPresence(agentId);
      
      if (!presence) {
        // Create default presence if not exists
        const defaultPresence = await storage.updateAgentPresence(agentId, {
          status: 'OFFLINE',
          currentChatCount: 0
        });
        return res.json(defaultPresence);
      }
      
      res.json(presence);
    } catch (error) {
      console.error("Error fetching agent presence:", error);
      res.status(500).json({ message: "Failed to fetch agent presence" });
    }
  });

  // Notification API routes
  app.post('/api/notifications/send', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const { insertNotificationSchema } = await import('@shared/schema');
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user); // Derive userId from authenticated user, ignore client input
      
      const body = insertNotificationSchema.parse({
        ...req.body,
        organizationId,
        userId, // Always use authenticated user's ID for security
      });
      
      const notification = await storage.createNotification(body);
      
      // Prevent caching to avoid 304 responses with body
      res.set('Cache-Control', 'no-store');
      res.json({
        success: true,
        notification
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.get('/api/notifications', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user);
      
      const notifications = await storage.getNotifications(userId, organizationId);
      const unreadCount = await storage.getUnreadNotificationsCount(userId, organizationId);
      
      // Prevent caching to ensure real-time updates
      res.set('Cache-Control', 'no-store');
      res.json({
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user);
      
      const notification = await storage.markNotificationAsRead(notificationId, userId, organizationId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      // Prevent caching to ensure immediate updates
      res.set('Cache-Control', 'no-store');
      res.json({
        success: true,
        notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Stripe Marketplace Checkout API
  app.post('/api/marketplace/checkout', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const { serviceId, quantity = 1, total } = req.body;
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user);

      if (!serviceId || !total) {
        return res.status(400).json({ error: 'Missing required fields: serviceId, total' });
      }

      // Create order in database first
      const order = await storage.createOrder({
        organizationId,
        serviceId,
        quantity,
        total,
        status: 'REQUESTED',
        assigneeVendorUserId: null,
        stripePaymentIntentId: null,
        options: req.body.options || null,
      });

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Service Order #${order.id}`,
                description: 'Marketplace Service',
              },
              unit_amount: Math.round(total * 100), // Convert to cents
            },
            quantity,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin || 'http://localhost:5000'}/marketplace?success=true`,
        cancel_url: `${req.headers.origin || 'http://localhost:5000'}/marketplace?canceled=true`,
        metadata: {
          orderId: order.id,
          organizationId,
          userId,
        },
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
        orderId: order.id,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Stripe Webhook Handler
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const event = req.body;

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          const { orderId } = session.metadata;

          if (orderId) {
            // Update order status to CONFIRMED when payment is successful
            await storage.updateOrderPaymentStatus(
              orderId,
              session.payment_intent,
              'CONFIRMED'
            );
            console.log(`Order ${orderId} marked as CONFIRMED after successful payment`);
          }
          break;

        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          console.log(`Payment failed for intent: ${paymentIntent.id}`);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // Social Media OAuth APIs
  // Meta (Facebook/Instagram) OAuth
  app.get('/api/social/oauth/meta/auth', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user);
      
      // Generate state parameter for security
      const state = Buffer.from(JSON.stringify({ organizationId, userId })).toString('base64');
      
      const metaAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      metaAuthUrl.searchParams.set('client_id', process.env.META_APP_ID || '');
      metaAuthUrl.searchParams.set('redirect_uri', `${req.headers.origin || 'http://localhost:5000'}/api/social/oauth/meta/callback`);
      metaAuthUrl.searchParams.set('state', state);
      metaAuthUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish');
      metaAuthUrl.searchParams.set('response_type', 'code');
      
      res.json({ authUrl: metaAuthUrl.toString() });
    } catch (error) {
      console.error('Error generating Meta OAuth URL:', error);
      res.status(500).json({ error: 'Failed to generate OAuth URL' });
    }
  });

  app.get('/api/social/oauth/meta/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      // Decode state to get organizationId and userId
      const { organizationId, userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.META_APP_ID || '',
          client_secret: process.env.META_APP_SECRET || '',
          redirect_uri: `${req.headers.origin || 'http://localhost:5000'}/api/social/oauth/meta/callback`,
          code: code as string,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        return res.status(400).json({ error: tokens.error.message });
      }

      // Get user's pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokens.access_token}`);
      const pagesData = await pagesResponse.json();

      // Save each page connection
      for (const page of pagesData.data || []) {
        await storage.createSocialConnection({
          organizationId,
          userId,
          provider: 'meta',
          accountId: page.id,
          accountType: 'page',
          displayName: page.name,
          scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
          accessTokenEnc: page.access_token, // In production, encrypt this
          refreshTokenEnc: null,
          expiresAt: null, // Page tokens don't expire
          status: 'active',
        });
      }

      // Redirect back to the frontend
      res.redirect(`${req.headers.origin || 'http://localhost:5000'}/social-connections?success=true`);
    } catch (error) {
      console.error('Error handling Meta OAuth callback:', error);
      res.redirect(`${req.headers.origin || 'http://localhost:5000'}/social-connections?error=true`);
    }
  });

  // LinkedIn OAuth
  app.get('/api/social/oauth/linkedin/auth', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const userId = getUserId(req.user);
      
      // Generate state parameter for security
      const state = Buffer.from(JSON.stringify({ organizationId, userId })).toString('base64');
      
      const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      linkedinAuthUrl.searchParams.set('response_type', 'code');
      linkedinAuthUrl.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID || '');
      linkedinAuthUrl.searchParams.set('redirect_uri', `${req.headers.origin || 'http://localhost:5000'}/api/social/oauth/linkedin/callback`);
      linkedinAuthUrl.searchParams.set('state', state);
      linkedinAuthUrl.searchParams.set('scope', 'w_member_social,w_organization_social');
      
      res.json({ authUrl: linkedinAuthUrl.toString() });
    } catch (error) {
      console.error('Error generating LinkedIn OAuth URL:', error);
      res.status(500).json({ error: 'Failed to generate OAuth URL' });
    }
  });

  app.get('/api/social/oauth/linkedin/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      // Decode state to get organizationId and userId
      const { organizationId, userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: `${req.headers.origin || 'http://localhost:5000'}/api/social/oauth/linkedin/callback`,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        return res.status(400).json({ error: tokens.error_description });
      }

      // Get user's company pages (organization access)
      const companiesResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      const companiesData = await companiesResponse.json();

      // Save LinkedIn connection
      await storage.createSocialConnection({
        organizationId,
        userId,
        provider: 'linkedin',
        accountId: userId, // Use user ID as account ID for now
        accountType: 'member',
        displayName: 'LinkedIn Personal',
        scopes: ['w_member_social', 'w_organization_social'],
        accessTokenEnc: tokens.access_token, // In production, encrypt this
        refreshTokenEnc: tokens.refresh_token || null,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        status: 'active',
      });

      // Redirect back to the frontend
      res.redirect(`${req.headers.origin || 'http://localhost:5000'}/social-connections?success=true`);
    } catch (error) {
      console.error('Error handling LinkedIn OAuth callback:', error);
      res.redirect(`${req.headers.origin || 'http://localhost:5000'}/social-connections?error=true`);
    }
  });

  // Get social connections for organization
  app.get('/api/social/connections', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const connections = await storage.getSocialConnections(organizationId);
      
      // Remove sensitive data before sending to client
      const safeConnections = connections.map(conn => ({
        ...conn,
        accessTokenEnc: undefined,
        refreshTokenEnc: undefined,
      }));
      
      res.json(safeConnections);
    } catch (error) {
      console.error('Error fetching social connections:', error);
      res.status(500).json({ error: 'Failed to fetch social connections' });
    }
  });

  // Delete social connection
  app.delete('/api/social/connections/:id', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.currentOrganization;
      
      const success = await storage.deleteSocialConnection(id, organizationId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Connection not found' });
      }
    } catch (error) {
      console.error('Error deleting social connection:', error);
      res.status(500).json({ error: 'Failed to delete social connection' });
    }
  });

  // Settings API Routes

  // Get user settings
  app.get('/api/settings/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error('Error getting user settings:', error);
      res.status(500).json({ error: 'Failed to get user settings' });
    }
  });

  // Update user settings
  app.patch('/api/settings/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate the incoming settings data
      const validatedSettings = userSettingsSchema.partial().parse(req.body);
      
      const updatedSettings = await storage.updateUserSettings(userId, validatedSettings);
      res.json(updatedSettings);
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      
      // Check if it's a validation error (Zod error)
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid settings data', 
          details: error.errors 
        });
      }
      
      // Server error
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });

  // Get organization settings
  app.get('/api/settings/organization', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const membership = req.currentMembership;
      
      const settings = await storage.getOrganizationSettings(organizationId);
      
      if (!settings) {
        return res.json({});
      }
      
      // Create a safe copy of settings - redact sensitive data for non-admins
      const safeSettings = { ...settings };
      
      if (!['ORG_ADMIN', 'SUPER_ADMIN'].includes(membership?.role)) {
        // Redact sensitive data for non-admin members
        if (safeSettings.developer) {
          if (safeSettings.developer.apiKeys) {
            safeSettings.developer.apiKeys = safeSettings.developer.apiKeys.map(key => ({
              ...key,
              key: '***REDACTED***',
            }));
          }
          if (safeSettings.developer.webhooks?.secret) {
            safeSettings.developer.webhooks.secret = '***REDACTED***';
          }
        }
      }
      
      res.json(safeSettings);
    } catch (error) {
      console.error('Error getting organization settings:', error);
      res.status(500).json({ error: 'Failed to get organization settings' });
    }
  });

  // Update organization settings (requires ORG_ADMIN or SUPER_ADMIN)
  app.patch('/api/settings/organization', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const membership = req.currentMembership;
      
      // Check if user has permission to update organization settings
      if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(membership?.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to update organization settings' });
      }
      
      // Validate the incoming settings data
      const validatedSettings = organizationSettingsSchema.partial().parse(req.body);
      
      const updatedSettings = await storage.updateOrganizationSettings(organizationId, validatedSettings);
      
      // Redact sensitive data in response
      const safeSettings = { ...updatedSettings };
      if (safeSettings.developer) {
        if (safeSettings.developer.apiKeys) {
          safeSettings.developer.apiKeys = safeSettings.developer.apiKeys.map(key => ({
            ...key,
            key: '***REDACTED***',
          }));
        }
        if (safeSettings.developer.webhooks?.secret) {
          safeSettings.developer.webhooks.secret = '***REDACTED***';
        }
      }
      
      res.json(safeSettings);
    } catch (error: any) {
      console.error('Error updating organization settings:', error);
      
      // Check if it's a validation error (Zod error)
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid settings data', 
          details: error.errors 
        });
      }
      
      // Server error
      res.status(500).json({ error: 'Failed to update organization settings' });
    }
  });

  // Get organization members (for user management section)
  app.get('/api/settings/organization/members', isAuthenticated, withCurrentOrganization, async (req: any, res) => {
    try {
      const organizationId = req.currentOrganization;
      const membership = req.currentMembership;
      
      // Check if user has permission to view members
      if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(membership?.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to view organization members' });
      }
      
      const members = await storage.getOrganizationMembers(organizationId);
      
      // Remove sensitive user data
      const safeMembers = members.map(member => ({
        ...member,
        user: {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          createdAt: member.user.createdAt,
        }
      }));
      
      res.json(safeMembers);
    } catch (error) {
      console.error('Error getting organization members:', error);
      res.status(500).json({ error: 'Failed to get organization members' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
