import {
  users,
  organizations,
  memberships,
  businessGoals,
  goalAttachments,
  budgetAllocations,
  campaigns,
  leads,
  opportunities,
  marketingTasks,
  offlineActivities,
  assets,
  assetLinks,
  services,
  orgServiceOrders,
  socialConnections,
  notifications,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Membership,
  type InsertMembership,
  type Campaign,
  type InsertCampaign,
  type Lead,
  type InsertLead,
  type Opportunity,
  type InsertOpportunity,
  type MarketingTask,
  type InsertMarketingTask,
  type OfflineActivity,
  type InsertOfflineActivity,
  type Asset,
  type AssetLink,
  type InsertAssetLink,
  type Service,
  type OrgServiceOrder,
  type SocialConnection,
  type InsertSocialConnection,
  type BusinessGoal,
  type InsertBusinessGoal,
  type GoalAttachment,
  type InsertGoalAttachment,
  type BudgetAllocation,
  type InsertBudgetAllocation,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, ne, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<(Organization & { membership: Membership })[]>;

  // Membership operations
  createMembership(membership: InsertMembership): Promise<Membership>;
  getUserMembership(userId: string, orgId: string): Promise<Membership | undefined>;
  getOrganizationMembers(orgId: string): Promise<(Membership & { user: User })[]>;

  // Goal operations
  createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal>;
  getBusinessGoals(orgId: string): Promise<BusinessGoal[]>;
  createGoalAttachment(attachment: InsertGoalAttachment): Promise<GoalAttachment>;
  createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation>;

  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaigns(orgId: string): Promise<Campaign[]>;
  getCampaign(id: string, orgId: string): Promise<Campaign | undefined>;
  updateCampaign(id: string, orgId: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;

  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(orgId: string): Promise<Lead[]>;
  getLead(id: string, orgId: string): Promise<Lead | undefined>;
  updateLead(id: string, orgId: string, updates: Partial<Lead>): Promise<Lead | undefined>;

  // Opportunity operations
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunities(orgId: string): Promise<Opportunity[]>;
  getOpportunity(id: string, orgId: string): Promise<Opportunity | undefined>;
  updateOpportunity(id: string, orgId: string, updates: Partial<Opportunity>): Promise<Opportunity | undefined>;

  // Task operations
  createMarketingTask(task: InsertMarketingTask): Promise<MarketingTask>;
  getMarketingTasks(orgId: string): Promise<MarketingTask[]>;
  getMarketingTask(id: string, orgId: string): Promise<MarketingTask | undefined>;
  updateMarketingTask(id: string, orgId: string, updates: Partial<MarketingTask>): Promise<MarketingTask | undefined>;

  // Offline Activity operations
  createOfflineActivity(activity: InsertOfflineActivity): Promise<OfflineActivity>;
  getOfflineActivities(orgId: string): Promise<OfflineActivity[]>;
  getOfflineActivity(id: string, orgId: string): Promise<OfflineActivity | undefined>;
  updateOfflineActivity(id: string, orgId: string, updates: Partial<OfflineActivity>): Promise<OfflineActivity | undefined>;

  // Asset operations
  getAssets(orgId: string): Promise<Asset[]>;
  getAsset(id: string, orgId: string): Promise<Asset | undefined>;
  getAssetByObjectPath(objectPath: string): Promise<Asset | undefined>;
  
  // AssetLink operations
  createAssetLink(assetLink: InsertAssetLink): Promise<AssetLink>;
  getAssetLinks(assetId: string, orgId: string): Promise<AssetLink[]>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;

  // Order operations
  createOrder(order: Omit<OrgServiceOrder, 'id' | 'createdAt'>): Promise<OrgServiceOrder>;
  getOrders(orgId: string): Promise<OrgServiceOrder[]>;
  updateOrderPaymentStatus(orderId: string, stripePaymentIntentId: string, status: 'CONFIRMED' | 'REQUESTED' | 'IN_PROGRESS' | 'DELIVERED' | 'CLOSED'): Promise<OrgServiceOrder | undefined>;

  // Social Connection operations
  createSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection>;
  getSocialConnections(orgId: string): Promise<SocialConnection[]>;
  getSocialConnection(id: string, orgId: string): Promise<SocialConnection | undefined>;
  updateSocialConnection(id: string, orgId: string, updates: Partial<SocialConnection>): Promise<SocialConnection | undefined>;
  deleteSocialConnection(id: string, orgId: string): Promise<boolean>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, orgId: string): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string, orgId: string): Promise<number>;
  markNotificationAsRead(id: string, userId: string, orgId: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string, orgId: string): Promise<void>;

  // Dashboard stats
  getDashboardStats(orgId: string): Promise<{
    activeCampaigns: number;
    totalLeads: number;
    totalOpportunities: number;
    openTasks: number;
  }>;

  // Recent activity and deadlines
  getRecentActivity(orgId: string): Promise<Array<{
    id: string;
    type: 'campaign' | 'lead' | 'task' | 'opportunity';
    description: string;
    timestamp: string;
    user?: string;
  }>>;
  
  getUpcomingDeadlines(orgId: string): Promise<Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getUserOrganizations(userId: string): Promise<(Organization & { membership: Membership })[]> {
    const result = await db
      .select()
      .from(organizations)
      .innerJoin(memberships, eq(organizations.id, memberships.organizationId))
      .where(eq(memberships.userId, userId));

    return result.map(row => ({
      ...row.organizations,
      membership: row.memberships,
    }));
  }

  // Membership operations
  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [created] = await db.insert(memberships).values(membership).returning();
    return created;
  }

  async getUserMembership(userId: string, orgId: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
    return membership;
  }

  async getOrganizationMembers(orgId: string): Promise<(Membership & { user: User })[]> {
    const result = await db
      .select()
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.organizationId, orgId));

    return result.map(row => ({
      ...row.memberships,
      user: row.users,
    }));
  }

  // Goal operations
  async createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal> {
    const [created] = await db.insert(businessGoals).values(goal).returning();
    return created;
  }

  async getBusinessGoals(orgId: string): Promise<BusinessGoal[]> {
    return await db
      .select()
      .from(businessGoals)
      .where(eq(businessGoals.organizationId, orgId))
      .orderBy(desc(businessGoals.createdAt));
  }

  async createGoalAttachment(attachment: InsertGoalAttachment): Promise<GoalAttachment> {
    const [created] = await db.insert(goalAttachments).values(attachment).returning();
    return created;
  }

  async createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation> {
    const [created] = await db.insert(budgetAllocations).values(allocation).returning();
    return created;
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }

  async getCampaigns(orgId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.organizationId, orgId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string, orgId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.organizationId, orgId)));
    return campaign;
  }

  async updateCampaign(id: string, orgId: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set(updates)
      .where(and(eq(campaigns.id, id), eq(campaigns.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Lead operations
  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async getLeads(orgId: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, orgId))
      .orderBy(desc(leads.createdAt));
  }

  async getLead(id: string, orgId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.organizationId, orgId)));
    return lead;
  }

  async updateLead(id: string, orgId: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updated] = await db
      .update(leads)
      .set(updates)
      .where(and(eq(leads.id, id), eq(leads.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Opportunity operations
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [created] = await db.insert(opportunities).values(opportunity).returning();
    return created;
  }

  async getOpportunities(orgId: string): Promise<Opportunity[]> {
    return await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.organizationId, orgId))
      .orderBy(desc(opportunities.createdAt));
  }

  async getOpportunity(id: string, orgId: string): Promise<Opportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.organizationId, orgId)));
    return opportunity;
  }

  async updateOpportunity(id: string, orgId: string, updates: Partial<Opportunity>): Promise<Opportunity | undefined> {
    const [updated] = await db
      .update(opportunities)
      .set(updates)
      .where(and(eq(opportunities.id, id), eq(opportunities.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Task operations
  async createMarketingTask(task: InsertMarketingTask): Promise<MarketingTask> {
    const [created] = await db.insert(marketingTasks).values(task).returning();
    return created;
  }

  async getMarketingTasks(orgId: string): Promise<MarketingTask[]> {
    return await db
      .select()
      .from(marketingTasks)
      .where(eq(marketingTasks.organizationId, orgId))
      .orderBy(desc(marketingTasks.createdAt));
  }

  async getMarketingTask(id: string, orgId: string): Promise<MarketingTask | undefined> {
    const [task] = await db
      .select()
      .from(marketingTasks)
      .where(and(eq(marketingTasks.id, id), eq(marketingTasks.organizationId, orgId)));
    return task;
  }

  async updateMarketingTask(id: string, orgId: string, updates: Partial<MarketingTask>): Promise<MarketingTask | undefined> {
    const [updated] = await db
      .update(marketingTasks)
      .set(updates)
      .where(and(eq(marketingTasks.id, id), eq(marketingTasks.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Offline Activity operations
  async createOfflineActivity(activity: InsertOfflineActivity): Promise<OfflineActivity> {
    const [created] = await db.insert(offlineActivities).values(activity).returning();
    return created;
  }

  async getOfflineActivities(orgId: string): Promise<OfflineActivity[]> {
    return await db
      .select()
      .from(offlineActivities)
      .where(eq(offlineActivities.organizationId, orgId))
      .orderBy(desc(offlineActivities.createdAt));
  }

  async getOfflineActivity(id: string, orgId: string): Promise<OfflineActivity | undefined> {
    const [activity] = await db
      .select()
      .from(offlineActivities)
      .where(and(eq(offlineActivities.id, id), eq(offlineActivities.organizationId, orgId)));
    return activity;
  }

  async updateOfflineActivity(id: string, orgId: string, updates: Partial<OfflineActivity>): Promise<OfflineActivity | undefined> {
    const [updated] = await db
      .update(offlineActivities)
      .set(updates)
      .where(and(eq(offlineActivities.id, id), eq(offlineActivities.organizationId, orgId)))
      .returning();
    return updated;
  }

  // Asset operations
  async getAssets(orgId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, orgId))
      .orderBy(desc(assets.createdAt));
  }

  async getAsset(id: string, orgId: string): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.id, id),
        eq(assets.organizationId, orgId)
      ));
    return asset;
  }

  async getAssetByObjectPath(objectPath: string): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.url, objectPath));
    return asset;
  }

  // AssetLink operations
  async createAssetLink(assetLinkData: InsertAssetLink): Promise<AssetLink> {
    const [assetLink] = await db
      .insert(assetLinks)
      .values(assetLinkData)
      .returning();
    return assetLink;
  }

  async getAssetLinks(assetId: string, orgId: string): Promise<AssetLink[]> {
    return await db
      .select()
      .from(assetLinks)
      .where(and(
        eq(assetLinks.assetId, assetId),
        eq(assetLinks.organizationId, orgId)
      ));
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  // Order operations
  async createOrder(order: Omit<OrgServiceOrder, 'id' | 'createdAt'>): Promise<OrgServiceOrder> {
    const [created] = await db.insert(orgServiceOrders).values(order).returning();
    return created;
  }

  async getOrders(orgId: string): Promise<OrgServiceOrder[]> {
    return await db
      .select()
      .from(orgServiceOrders)
      .where(eq(orgServiceOrders.organizationId, orgId))
      .orderBy(desc(orgServiceOrders.createdAt));
  }

  async updateOrderPaymentStatus(orderId: string, stripePaymentIntentId: string, status: 'CONFIRMED' | 'REQUESTED' | 'IN_PROGRESS' | 'DELIVERED' | 'CLOSED'): Promise<OrgServiceOrder | undefined> {
    const [updated] = await db
      .update(orgServiceOrders)
      .set({ 
        status, 
        stripePaymentIntentId 
      })
      .where(eq(orgServiceOrders.id, orderId))
      .returning();
    return updated;
  }

  // Social Connection operations
  async createSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection> {
    const [created] = await db.insert(socialConnections).values(connection).returning();
    return created;
  }

  async getSocialConnections(orgId: string): Promise<SocialConnection[]> {
    return await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.organizationId, orgId))
      .orderBy(desc(socialConnections.createdAt));
  }

  async getSocialConnection(id: string, orgId: string): Promise<SocialConnection | undefined> {
    const [connection] = await db
      .select()
      .from(socialConnections)
      .where(and(eq(socialConnections.id, id), eq(socialConnections.organizationId, orgId)));
    return connection;
  }

  async updateSocialConnection(id: string, orgId: string, updates: Partial<SocialConnection>): Promise<SocialConnection | undefined> {
    const [updated] = await db
      .update(socialConnections)
      .set(updates)
      .where(and(eq(socialConnections.id, id), eq(socialConnections.organizationId, orgId)))
      .returning();
    return updated;
  }

  async deleteSocialConnection(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .delete(socialConnections)
      .where(and(eq(socialConnections.id, id), eq(socialConnections.organizationId, orgId)));
    return result.rowCount > 0;
  }

  // Dashboard stats
  async getDashboardStats(orgId: string): Promise<{
    activeCampaigns: number;
    totalLeads: number;
    totalOpportunities: number;
    openTasks: number;
  }> {
    const [activeCampaignsResult] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.organizationId, orgId), eq(campaigns.status, 'ACTIVE')));

    const [totalLeadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.organizationId, orgId));

    const [totalOpportunitiesResult] = await db
      .select({ count: count() })
      .from(opportunities)
      .where(eq(opportunities.organizationId, orgId));

    const [openTasksResult] = await db
      .select({ count: count() })
      .from(marketingTasks)
      .where(and(
        eq(marketingTasks.organizationId, orgId),
        eq(marketingTasks.status, 'IN_PROGRESS')
      ));

    return {
      activeCampaigns: activeCampaignsResult.count,
      totalLeads: totalLeadsResult.count,
      totalOpportunities: totalOpportunitiesResult.count,
      openTasks: openTasksResult.count,
    };
  }

  async getRecentActivity(orgId: string): Promise<Array<{
    id: string;
    type: 'campaign' | 'lead' | 'task' | 'opportunity';
    description: string;
    timestamp: string;
    user?: string;
  }>> {
    const activities = [];

    // Get recent campaigns (last 7 days)
    const recentCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.organizationId, orgId))
      .orderBy(desc(campaigns.createdAt))
      .limit(3);

    for (const campaign of recentCampaigns) {
      if (campaign.createdAt) {
        activities.push({
          id: campaign.id,
          type: 'campaign' as const,
          description: `Nuova campagna "${campaign.name}" creata`,
          timestamp: this.formatRelativeTime(campaign.createdAt),
        });
      }
    }

    // Get recent leads (last 7 days)
    const recentLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, orgId))
      .orderBy(desc(leads.createdAt))
      .limit(3);

    for (const lead of recentLeads) {
      if (lead.createdAt) {
        activities.push({
          id: lead.id,
          type: 'lead' as const,
          description: `Nuovo lead: ${lead.firstName} ${lead.lastName} da ${lead.company || lead.source}`,
          timestamp: this.formatRelativeTime(lead.createdAt),
        });
      }
    }

    // Get recent completed tasks
    const recentTasks = await db
      .select()
      .from(marketingTasks)
      .where(and(
        eq(marketingTasks.organizationId, orgId),
        eq(marketingTasks.status, 'DONE')
      ))
      .orderBy(desc(marketingTasks.createdAt))
      .limit(3);

    for (const task of recentTasks) {
      if (task.createdAt) {
        activities.push({
          id: task.id,
          type: 'task' as const,
          description: `Attività completata: "${task.title}"`,
          timestamp: this.formatRelativeTime(task.createdAt),
        });
      }
    }

    // Get recent opportunities
    const recentOpportunities = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.organizationId, orgId))
      .orderBy(desc(opportunities.createdAt))
      .limit(2);

    for (const opportunity of recentOpportunities) {
      if (opportunity.createdAt) {
        activities.push({
          id: opportunity.id,
          type: 'opportunity' as const,
          description: `Nuova opportunità: "${opportunity.title}" (€${opportunity.amount})`,
          timestamp: this.formatRelativeTime(opportunity.createdAt),
        });
      }
    }

    // Activities are already sorted by creation time from individual queries
    return activities.slice(0, 6);
  }

  async getUpcomingDeadlines(orgId: string): Promise<Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>> {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const upcomingTasks = await db
      .select()
      .from(marketingTasks)
      .where(and(
        eq(marketingTasks.organizationId, orgId),
        ne(marketingTasks.status, 'DONE'),
        isNotNull(marketingTasks.dueAt)
      ))
      .orderBy(marketingTasks.dueAt)
      .limit(10);

    return upcomingTasks
      .filter(task => task.dueAt && new Date(task.dueAt) <= nextWeek)
      .map(task => ({
        id: task.id,
        title: task.title,
        dueDate: this.formatDueDate(task.dueAt!),
        priority: task.priority || 'P2',
      }));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getNotifications(userId: string, orgId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: string, orgId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId),
        eq(notifications.isRead, false)
      ));
    return result.count;
  }

  async markNotificationAsRead(id: string, userId: string, orgId: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId)
      ))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string, orgId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, orgId),
        eq(notifications.isRead, false)
      ));
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Meno di un\'ora fa';
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
    } else {
      return date.toLocaleDateString('it-IT');
    }
  }

  private formatDueDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
      return 'Scade oggi';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Scade domani';
    } else if (taskDate < today) {
      return 'Scaduto';
    } else {
      const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `Scade tra ${diffDays} giorni`;
    }
  }
}

export const storage = new DatabaseStorage();
