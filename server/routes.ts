import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOrganizationSchema,
  insertMembershipSchema,
  insertCampaignSchema,
  insertLeadSchema,
  insertOpportunitySchema,
  insertMarketingTaskSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);
      
      res.json({ ...user, organizations });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
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

  // Dashboard stats
  app.get('/api/organizations/:id/dashboard-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getDashboardStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent activity
  app.get('/api/organizations/:id/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const activities = await storage.getRecentActivity(orgId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Upcoming deadlines
  app.get('/api/organizations/:id/upcoming-deadlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const deadlines = await storage.getUpcomingDeadlines(orgId);
      res.json(deadlines);
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      res.status(500).json({ message: "Failed to fetch upcoming deadlines" });
    }
  });

  // Campaign routes
  app.post('/api/organizations/:orgId/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      // Check if user has access and permission
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership || !['ORG_ADMIN', 'MARKETER'].includes(membership.role)) {
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

  app.get('/api/organizations/:orgId/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const campaigns = await storage.getCampaigns(orgId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Lead routes
  app.post('/api/organizations/:orgId/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership || !['ORG_ADMIN', 'SALES'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const leadData = insertLeadSchema.parse({
        ...req.body,
        organizationId: orgId,
        ownerId: userId,
      });
      
      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.get('/api/organizations/:orgId/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const leads = await storage.getLeads(orgId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Opportunity routes
  app.post('/api/organizations/:orgId/opportunities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership || !['ORG_ADMIN', 'SALES'].includes(membership.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const opportunityData = insertOpportunitySchema.parse({
        ...req.body,
        organizationId: orgId,
        ownerId: userId,
      });
      
      const opportunity = await storage.createOpportunity(opportunityData);
      res.json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.get('/api/organizations/:orgId/opportunities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const opportunities = await storage.getOpportunities(orgId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  // Task routes
  app.post('/api/organizations/:orgId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const taskData = insertMarketingTaskSchema.parse({
        ...req.body,
        organizationId: orgId,
      });
      
      const task = await storage.createMarketingTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/organizations/:orgId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const membership = await storage.getUserMembership(userId, orgId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tasks = await storage.getMarketingTasks(orgId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
