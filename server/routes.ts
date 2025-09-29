import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { organizations } from "@shared/schema";
import { count } from "drizzle-orm";
import { 
  insertOrganizationSchema,
  insertMembershipSchema,
  insertCampaignSchema,
  insertLeadSchema,
  insertOpportunitySchema,
  insertMarketingTaskSchema 
} from "@shared/schema";
import { assets } from "@shared/schema";
import { createSocialPost, getSocialPosts } from "../app/api/social/posts/route";
import { scheduleSocialPost, unscheduleSocialPost } from "../app/api/social/posts/[id]/schedule/route";
import { publishSocialPost, getPublishStatus } from "../app/api/social/posts/[id]/publish/route";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Upload routes
  app.post('/api/upload/init', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { organizationId, filename } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      // Verify user has access to this organization
      const userOrgs = await storage.getUserOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }
      
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      const { uploadUrl, publicUrl, objectPath } = await objectStorageService.getObjectEntityUploadURL(filename || 'file');
      
      res.json({
        uploadUrl,
        objectPath,
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  app.post('/api/upload/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = req.body;
      
      if (!body.objectPath || !body.organizationId) {
        return res.status(400).json({ error: 'Missing required fields: objectPath and organizationId' });
      }
      
      // Verify user has access to this organization
      const userOrgs = await storage.getUserOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === body.organizationId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this organization' });
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

      // Create asset data with normalized object path for serving
      const assetData = {
        organizationId: body.organizationId,
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
  app.post('/api/social/posts', isAuthenticated, createSocialPost);
  app.get('/api/social/posts', isAuthenticated, getSocialPosts);
  app.patch('/api/social/posts/:id/schedule', isAuthenticated, scheduleSocialPost);
  app.delete('/api/social/posts/:id/schedule', isAuthenticated, unscheduleSocialPost);
  app.post('/api/social/posts/:id/publish', isAuthenticated, publishSocialPost);
  app.get('/api/social/posts/:id/publish', isAuthenticated, getPublishStatus);

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
      const userId = req.user.claims.sub;
      const { type } = req.body;
      
      const conversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        status: 'active' as const,
        type: type || 'chat_start',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real implementation, this would be saved to database
      // For now, we'll return the mock conversation
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;
      
      // Mock conversation data
      const conversation = {
        id: conversationId,
        userId,
        status: 'active' as const,
        messages: [
          {
            id: 'greeting',
            text: 'Ciao, piacere sono Francesca. Come posso aiutarti?',
            sender: 'francesca',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;
      const { text, sender } = req.body;

      if (!text || !sender) {
        return res.status(400).json({ message: "Text and sender are required" });
      }

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        text,
        sender,
        timestamp: new Date().toISOString(),
        userId: sender === 'user' ? userId : null
      };

      // In a real implementation, this would be saved to database
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/conversations/:id/escalate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;
      
      // Mock escalation process
      const escalation = {
        id: `escalation-${Date.now()}`,
        conversationId,
        userId,
        escalatedAt: new Date().toISOString(),
        reason: 'User requested escalation',
        status: 'escalated' as const,
        assignedTo: 'specialist-team',
        estimatedResponseTime: '15 minutes'
      };

      // In a real implementation, this would:
      // 1. Update conversation status to 'escalated'
      // 2. Notify specialist team
      // 3. Create escalation record in database
      // 4. Send alerts/notifications

      res.json({
        success: true,
        escalation,
        message: 'Conversation has been escalated to specialist team'
      });
    } catch (error) {
      console.error("Error escalating conversation:", error);
      res.status(500).json({ message: "Failed to escalate conversation" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Mock conversations list for user
      const conversations = [
        {
          id: `conv-${Date.now()}-1`,
          userId,
          status: 'active' as const,
          lastMessage: 'Ciao, piacere sono Francesca. Come posso aiutarti?',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString()
        }
      ];

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Console API routes for operators (SUPER_ADMIN only)
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
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
      // Mock conversations data for now
      const conversations = [
        {
          id: `conv-${Date.now()}-1`,
          userId: 'user-123',
          status: 'PENDING' as const,
          channel: 'WIDGET' as const,
          assigneeId: null,
          escalatedAt: null,
          closedAt: null,
          subject: null,
          priority: 'P2' as const,
          createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          updatedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          customerName: 'Marco Rossi',
          lastMessage: 'Ho bisogno di aiuto urgente con il mio ordine. È stato addebitato ma non ricevuto.',
          messages: []
        },
        {
          id: `conv-${Date.now()}-2`,
          userId: 'user-456',
          status: 'PENDING' as const,
          channel: 'WIDGET' as const,
          assigneeId: null,
          escalatedAt: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          closedAt: null,
          subject: null,
          priority: 'P1' as const,
          createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          updatedAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          customerName: 'Laura Bianchi',
          lastMessage: 'Il sistema non funziona, non riesco ad accedere al mio account da stamattina.',
          messages: []
        },
        {
          id: `conv-${Date.now()}-3`,
          userId: 'user-789',
          status: 'OPEN' as const,
          channel: 'WIDGET' as const,
          assigneeId: 'agent-001',
          escalatedAt: null,
          closedAt: null,
          subject: 'Supporto tecnico',
          priority: 'P2' as const,
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
          customerName: 'Giuseppe Verdi',
          lastMessage: 'Perfetto, grazie per il supporto. Ora funziona tutto.',
          messages: []
        }
      ];

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching console conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get available agents
  app.get('/api/console/agents', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      // Mock agents data
      const agents = [
        {
          id: 'agent-001',
          name: 'Sofia Martini',
          available: true,
          currentChats: 2,
          maxChats: 5
        },
        {
          id: 'agent-002',
          name: 'Andrea Romano',
          available: true,
          currentChats: 1,
          maxChats: 4
        },
        {
          id: 'agent-003',
          name: 'Chiara Conti',
          available: true,
          currentChats: 0,
          maxChats: 6
        },
        {
          id: 'agent-004',
          name: 'Luca Ferretti',
          available: false,
          currentChats: 5,
          maxChats: 5
        }
      ];

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
      
      // In a real implementation, this would:
      // 1. Update conversation status to 'OPEN'
      // 2. Set assigneeId to the operator who accepted
      // 3. Update updatedAt timestamp
      // 4. Optionally notify the customer
      
      console.log(`Conversation ${conversationId} accepted by operator ${operatorId}`);
      
      res.json({
        success: true,
        message: 'Conversation accepted successfully',
        conversationId,
        assigneeId: operatorId,
        acceptedAt: new Date().toISOString()
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
      const operatorId = (req.user as any)?.claims?.sub;
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required for transfer" });
      }
      
      // In a real implementation, this would:
      // 1. Update conversation assigneeId to the new agent
      // 2. Update updatedAt timestamp  
      // 3. Log the transfer action
      // 4. Notify both the previous and new agent
      // 5. Optionally notify the customer about the transfer
      
      console.log(`Conversation ${conversationId} transferred from ${operatorId} to agent ${agentId}`);
      
      res.json({
        success: true,
        message: 'Conversation transferred successfully',
        conversationId,
        fromOperator: operatorId,
        toAgent: agentId,
        transferredAt: new Date().toISOString()
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
      
      // In a real implementation, this would:
      // 1. Update conversation status to 'CLOSED'
      // 2. Set closedAt timestamp
      // 3. Update updatedAt timestamp
      // 4. Log the closure action
      // 5. Optionally send closure notification to customer
      // 6. Update agent availability/chat count
      
      console.log(`Conversation ${conversationId} closed by operator ${operatorId}`);
      
      res.json({
        success: true,
        message: 'Conversation closed successfully',
        conversationId,
        closedBy: operatorId,
        closedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error closing conversation:", error);
      res.status(500).json({ message: "Failed to close conversation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
