import {
  users,
  organizations,
  memberships,
  businessGoals,
  goalAttachments,
  budgetAllocations,
  goalPlans,
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
  conversations,
  conversationMessages,
  agentPresence,
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
  type Conversation,
  type InsertConversation,
  type ConversationMessage,
  type InsertConversationMessage,
  type AgentPresence,
  type InsertAgentPresence,
  type UserSettings,
  type OrganizationSettings,
  type GoalPlan,
  type InsertGoalPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, ne, isNotNull, sql } from "drizzle-orm";

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
  getActiveGoal(orgId: string): Promise<BusinessGoal | undefined>;
  deleteBusinessGoal(goalId: string): Promise<void>;
  updateBusinessGoal(goalId: string, updates: Partial<BusinessGoal>): Promise<BusinessGoal | undefined>;
  createGoalAttachment(attachment: InsertGoalAttachment): Promise<GoalAttachment>;
  createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation>;
  createOrUpdateGoalPlan(plan: InsertGoalPlan): Promise<GoalPlan>;
  getGoalPlanByGoalId(goalId: string): Promise<GoalPlan | undefined>;
  getTaskCountByGoalId(goalId: string): Promise<number>;
  deleteTasksByGoalId(goalId: string): Promise<void>;

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

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversations(userId?: string, status?: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  assignConversation(id: string, assigneeId: string): Promise<Conversation | undefined>;
  closeConversation(id: string): Promise<Conversation | undefined>;

  // Conversation message operations
  createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  getConversationMessages(conversationId: string): Promise<ConversationMessage[]>;

  // Agent presence operations
  updateAgentPresence(agentId: string, presence: Partial<InsertAgentPresence>): Promise<AgentPresence>;
  getAgentPresence(agentId: string): Promise<AgentPresence | undefined>;
  getAvailableAgents(): Promise<AgentPresence[]>;
  incrementAgentChatCount(agentId: string): Promise<void>;
  decrementAgentChatCount(agentId: string): Promise<void>;

  // Settings operations
  getUserSettings(userId: string): Promise<UserSettings | null>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings>;
  getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null>;
  updateOrganizationSettings(orgId: string, settings: Partial<OrganizationSettings>): Promise<OrganizationSettings>;

  // Task automation operations
  createMarketingTaskWithAutomation(task: InsertMarketingTask): Promise<MarketingTask>;
  applyTaskAutomationRules(task: InsertMarketingTask, orgSettings: OrganizationSettings | null): Promise<InsertMarketingTask>;
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

  async getActiveGoal(orgId: string): Promise<BusinessGoal | undefined> {
    const [goal] = await db
      .select()
      .from(businessGoals)
      .where(eq(businessGoals.organizationId, orgId))
      .orderBy(desc(businessGoals.createdAt))
      .limit(1);
    return goal;
  }

  async deleteBusinessGoal(goalId: string): Promise<void> {
    // Delete related tasks first
    await this.deleteTasksByGoalId(goalId);
    
    // Delete goal plan
    await db
      .delete(goalPlans)
      .where(eq(goalPlans.goalId, goalId));
    
    // Delete budget allocations
    await db
      .delete(budgetAllocations)
      .where(eq(budgetAllocations.goalId, goalId));
    
    // Delete goal attachments
    await db
      .delete(goalAttachments)
      .where(eq(goalAttachments.goalId, goalId));
    
    // Finally delete the goal itself
    await db
      .delete(businessGoals)
      .where(eq(businessGoals.id, goalId));
  }

  async updateBusinessGoal(goalId: string, updates: Partial<BusinessGoal>): Promise<BusinessGoal | undefined> {
    const [updated] = await db
      .update(businessGoals)
      .set(updates)
      .where(eq(businessGoals.id, goalId))
      .returning();
    return updated;
  }

  async createGoalAttachment(attachment: InsertGoalAttachment): Promise<GoalAttachment> {
    const [created] = await db.insert(goalAttachments).values(attachment).returning();
    return created;
  }

  async createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation> {
    const [created] = await db.insert(budgetAllocations).values(allocation).returning();
    return created;
  }

  async createOrUpdateGoalPlan(plan: InsertGoalPlan): Promise<GoalPlan> {
    const [upserted] = await db
      .insert(goalPlans)
      .values({
        ...plan,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: goalPlans.goalId,
        set: {
          spec: plan.spec,
          generatedAt: new Date(),
          version: sql`${goalPlans.version} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getGoalPlanByGoalId(goalId: string): Promise<GoalPlan | undefined> {
    const [plan] = await db
      .select()
      .from(goalPlans)
      .where(eq(goalPlans.goalId, goalId));
    return plan;
  }

  async getTaskCountByGoalId(goalId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(marketingTasks)
      .where(eq(marketingTasks.goalId, goalId));
    return result[0]?.count || 0;
  }

  async deleteTasksByGoalId(goalId: string): Promise<void> {
    await db
      .delete(marketingTasks)
      .where(eq(marketingTasks.goalId, goalId));
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
    return (result.rowCount || 0) > 0;
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

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async getConversations(userId?: string, status?: string): Promise<Conversation[]> {
    if (userId && status) {
      return await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.userId, userId), eq(conversations.status, status as any)))
        .orderBy(desc(conversations.updatedAt));
    } else if (userId) {
      return await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
    } else if (status) {
      return await db
        .select()
        .from(conversations)
        .where(eq(conversations.status, status as any))
        .orderBy(desc(conversations.updatedAt));
    }
    
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async assignConversation(id: string, assigneeId: string): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ 
        assigneeId, 
        status: 'PENDING',
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async closeConversation(id: string): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ 
        status: 'CLOSED',
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  // Conversation message operations
  async createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage> {
    const [created] = await db.insert(conversationMessages).values(message).returning();
    
    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return created;
  }

  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    return await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(conversationMessages.createdAt);
  }

  // Agent presence operations
  async updateAgentPresence(agentId: string, presence: Partial<InsertAgentPresence>): Promise<AgentPresence> {
    const existingPresence = await this.getAgentPresence(agentId);
    
    if (existingPresence) {
      const [updated] = await db
        .update(agentPresence)
        .set({ ...presence, lastActiveAt: new Date() })
        .where(eq(agentPresence.agentId, agentId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(agentPresence)
        .values({ 
          agentId, 
          ...presence, 
          lastActiveAt: new Date() 
        })
        .returning();
      return created;
    }
  }

  async getAgentPresence(agentId: string): Promise<AgentPresence | undefined> {
    const [presence] = await db
      .select()
      .from(agentPresence)
      .where(eq(agentPresence.agentId, agentId));
    return presence;
  }

  async getAvailableAgents(): Promise<AgentPresence[]> {
    return await db
      .select()
      .from(agentPresence)
      .where(eq(agentPresence.status, 'ONLINE'))
      .orderBy(agentPresence.currentChatCount);
  }

  async incrementAgentChatCount(agentId: string): Promise<void> {
    await db
      .update(agentPresence)
      .set({ 
        currentChatCount: sql`${agentPresence.currentChatCount} + 1`,
        lastActiveAt: new Date()
      })
      .where(eq(agentPresence.agentId, agentId));
  }

  async decrementAgentChatCount(agentId: string): Promise<void> {
    await db
      .update(agentPresence)
      .set({ 
        currentChatCount: sql`GREATEST(0, ${agentPresence.currentChatCount} - 1)`,
        lastActiveAt: new Date()
      })
      .where(eq(agentPresence.agentId, agentId));
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId));
    
    return user?.settings as UserSettings || null;
  }

  async updateUserSettings(userId: string, settingsUpdate: Partial<UserSettings>): Promise<UserSettings> {
    // Get current settings first
    const currentUser = await this.getUser(userId);
    const currentSettings = (currentUser?.settings as UserSettings) || {};
    
    // Deep merge the settings
    const mergedSettings = this.deepMerge(currentSettings, settingsUpdate);
    
    // Update the user
    const [updated] = await db
      .update(users)
      .set({ 
        settings: mergedSettings,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({ settings: users.settings });
    
    return updated.settings as UserSettings;
  }

  async getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null> {
    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, orgId));
    
    return org?.settings as OrganizationSettings || null;
  }

  async updateOrganizationSettings(orgId: string, settingsUpdate: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    // Get current settings first
    const currentOrg = await this.getOrganization(orgId);
    const currentSettings = (currentOrg?.settings as OrganizationSettings) || {};
    
    // Deep merge the settings
    const mergedSettings = this.deepMerge(currentSettings, settingsUpdate);
    
    // Update the organization
    const [updated] = await db
      .update(organizations)
      .set({ 
        settings: mergedSettings
      })
      .where(eq(organizations.id, orgId))
      .returning({ settings: organizations.settings });
    
    return updated.settings as OrganizationSettings;
  }

  // Helper method for deep merging settings objects
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Task automation operations
  async createMarketingTaskWithAutomation(task: InsertMarketingTask): Promise<MarketingTask> {
    // Check for existing similar tasks to avoid duplicates (idempotency)
    const existingTasks = await db.query.marketingTasks.findMany({
      where: and(
        eq(marketingTasks.organizationId, task.organizationId),
        eq(marketingTasks.type, task.type),
        eq(marketingTasks.subtype, task.subtype || ''),
        task.leadId ? eq(marketingTasks.leadId, task.leadId) : sql`lead_id IS NULL`,
        task.opportunityId ? eq(marketingTasks.opportunityId, task.opportunityId) : sql`opportunity_id IS NULL`,
        task.campaignId ? eq(marketingTasks.campaignId, task.campaignId) : sql`campaign_id IS NULL`,
        ne(marketingTasks.status, 'DONE') // Only check for non-completed tasks
      ),
    });
    
    // If similar task already exists, return existing task instead of creating duplicate
    if (existingTasks.length > 0) {
      return existingTasks[0] as MarketingTask;
    }
    
    // Get organization settings for automation rules
    const orgSettings = await this.getOrganizationSettings(task.organizationId);
    
    // Apply automation rules to modify task properties
    const automatedTask = await this.applyTaskAutomationRules(task, orgSettings);
    
    // Create the task with automated properties
    return this.createMarketingTask(automatedTask);
  }

  async applyTaskAutomationRules(task: InsertMarketingTask, orgSettings: OrganizationSettings | null): Promise<InsertMarketingTask> {
    const result = { ...task };
    
    if (!orgSettings?.workflows?.taskAutomation) {
      return result;
    }
    
    const automation = orgSettings.workflows.taskAutomation;
    const now = new Date();
    
    // Rule 1: Event deadline escalation - events within configured days become higher priority
    if (automation.eventDeadlineEscalation?.enabled && result.dueAt) {
      const dueDate = new Date(result.dueAt);
      const daysBefore = automation.eventDeadlineEscalation.daysBefore || 30;
      const escalationDate = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
      
      if (dueDate <= escalationDate) {
        result.priority = automation.eventDeadlineEscalation.targetPriority || 'P1';
      }
    }
    
    // Rule 2: Brand review reminder for print materials
    if (automation.brandReviewReminder?.enabled && 
        automation.brandReviewReminder.triggerOnPrintMaterials &&
        (result.type === 'marketing_offline' && ['print', 'brochure', 'flyer', 'banner'].some(type => 
          result.subtype?.toLowerCase().includes(type)))) {
      
      // Create additional reminder task for brand review
      const daysBefore = automation.brandReviewReminder.daysBefore || 7;
      const reviewDueDate = result.dueAt ? 
        new Date(new Date(result.dueAt).getTime() - daysBefore * 24 * 60 * 60 * 1000) : 
        new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
      
      // Set high priority for brand review
      if (result.dueAt && new Date(result.dueAt).getTime() - now.getTime() <= daysBefore * 24 * 60 * 60 * 1000) {
        result.priority = 'P1';
      }
    }
    
    // Rule 3: Lead follow-up automation - if this is a lead-related task
    if (automation.leadFollowUp?.enabled && 
        (result.type === 'lead_management' || result.subtype?.includes('lead'))) {
      
      const firstFollowUpHours = automation.leadFollowUp.firstFollowUpHours || 24;
      
      // If no due date set, set it based on first follow-up rule  
      if (!result.dueAt) {
        result.dueAt = new Date(now.getTime() + firstFollowUpHours * 60 * 60 * 1000);
        result.priority = 'P1'; // Lead follow-ups are high priority
      }
    }
    
    // Rule 4: Opportunity reminder escalation
    if (automation.opportunityReminders?.enabled && 
        (result.type === 'opportunity_management' || result.subtype?.includes('opportunity'))) {
      
      const escalateAfterDays = automation.opportunityReminders.escalateAfterDays || 7;
      
      if (result.dueAt) {
        const dueDate = new Date(result.dueAt);
        const escalationThreshold = new Date(now.getTime() + escalateAfterDays * 24 * 60 * 60 * 1000);
        
        if (dueDate <= escalationThreshold) {
          result.priority = 'P1';
        }
      }
    }
    
    return result;
  }
}

export const storage = new DatabaseStorage();
