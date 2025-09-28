import {
  users,
  organizations,
  memberships,
  campaigns,
  leads,
  opportunities,
  marketingTasks,
  assets,
  services,
  orgServiceOrders,
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
  type Asset,
  type Service,
  type OrgServiceOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<(Organization & { membership: Membership })[]>;

  // Membership operations
  createMembership(membership: InsertMembership): Promise<Membership>;
  getUserMembership(userId: string, orgId: string): Promise<Membership | undefined>;
  getOrganizationMembers(orgId: string): Promise<(Membership & { user: User })[]>;

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

  // Asset operations
  getAssets(orgId: string): Promise<Asset[]>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;

  // Order operations
  createOrder(order: Omit<OrgServiceOrder, 'id' | 'createdAt'>): Promise<OrgServiceOrder>;
  getOrders(orgId: string): Promise<OrgServiceOrder[]>;

  // Dashboard stats
  getDashboardStats(orgId: string): Promise<{
    activeCampaigns: number;
    totalLeads: number;
    totalOpportunities: number;
    openTasks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Asset operations
  async getAssets(orgId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, orgId))
      .orderBy(desc(assets.createdAt));
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
}

export const storage = new DatabaseStorage();
