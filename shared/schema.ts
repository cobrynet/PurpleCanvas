import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER', 'SALES', 'VIEWER']);
export const priorityEnum = pgEnum('priority', ['P0', 'P1', 'P2', 'P3']);
export const campaignStatusEnum = pgEnum('campaign_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']);
export const campaignTypeEnum = pgEnum('campaign_type', ['ORGANICO', 'ADV', 'MIXED']);
export const taskStatusEnum = pgEnum('task_status', ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'DONE']);
export const assetTypeEnum = pgEnum('asset_type', ['IMAGE', 'VIDEO', 'DOC', 'ARCHIVE']);
export const conversationStatusEnum = pgEnum('conversation_status', ['OPEN', 'PENDING', 'CLOSED']);
export const channelEnum = pgEnum('channel', ['WIDGET', 'EMAIL']);
export const agentPresenceStatusEnum = pgEnum('agent_presence_status', ['ONLINE', 'AWAY', 'OFFLINE']);
export const orderStatusEnum = pgEnum('order_status', ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'CLOSED']);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Core multi-tenant tables
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }),
  billingCustomerId: varchar("billing_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: roleEnum("role").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  entity: varchar("entity").notNull(),
  entityId: varchar("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing tables
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: campaignTypeEnum("type").default('ORGANICO'),
  status: campaignStatusEnum("status").default('DRAFT'),
  objective: text("objective"),
  budget: real("budget"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  priority: priorityEnum("priority").default('P2'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignChannels = pgTable("campaign_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  channel: varchar("channel").notNull(),
  settings: jsonb("settings"),
});

export const marketingTasks = pgTable("marketing_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type").notNull(),
  subtype: varchar("subtype"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  status: taskStatusEnum("status").default('BACKLOG'),
  priority: priorityEnum("priority").default('P2'),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  kind: varchar("kind").notNull(), // post, ad_creative, email
  usage: varchar("usage").notNull(), // organico, adv, entrambi
  title: varchar("title"),
  body: text("body"),
  channel: varchar("channel"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status"),
  assetIds: jsonb("asset_ids"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const audiences = pgTable("audiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  criteria: jsonb("criteria"),
  sizeEstimate: integer("size_estimate"),
});

export const marketingMetrics = pgTable("marketing_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  ctr: real("ctr"),
  conversions: integer("conversions"),
  spend: real("spend"),
  revenue: real("revenue"),
}, (table) => [
  index("idx_marketing_metrics_campaign_date").on(table.campaignId, table.date)
]);

// Social & Assets
export const socialConnections = pgTable("social_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id),
  provider: varchar("provider").notNull(), // meta, linkedin, tiktok, x
  accountId: varchar("account_id").notNull(),
  accountType: varchar("account_type").notNull(), // page, business, member
  displayName: varchar("display_name"),
  scopes: jsonb("scopes"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at"),
  status: varchar("status").notNull(), // active, expired, revoked
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  usage: varchar("usage").notNull(), // organico, adv
  channel: varchar("channel").notNull(), // fb, ig, li, tt, x
  connectionId: uuid("connection_id").notNull().references(() => socialConnections.id),
  content: text("content"),
  assetIds: jsonb("asset_ids"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status").default('draft'), // draft, scheduled, publishing, published, failed
  externalPostId: varchar("external_post_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  type: assetTypeEnum("type").notNull(),
  mimeType: varchar("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSec: integer("duration_sec"),
  checksumSha256: varchar("checksum_sha256").notNull(),
  url: text("url").notNull(),
  thumbUrl: text("thumb_url"),
  title: varchar("title"),
  tags: text("tags").array(),
  folder: varchar("folder"),
  rights: jsonb("rights"),
  ownerId: varchar("owner_id").references(() => users.id),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_assets_organization").on(table.organizationId)
]);

export const assetLinks = pgTable("asset_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  relatedType: varchar("related_type").notNull(), // campaign, content, social_post, lead, opportunity
  relatedId: uuid("related_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM tables
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain"),
  industry: varchar("industry"),
  size: varchar("size"),
  territory: varchar("territory"),
  ownerId: varchar("owner_id").references(() => users.id),
  rating: varchar("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  accountId: uuid("account_id").references(() => accounts.id),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  title: varchar("title"),
  ownerId: varchar("owner_id").references(() => users.id),
  consentMarketing: boolean("consent_marketing").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  source: varchar("source"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  ownerId: varchar("owner_id").references(() => users.id),
  status: varchar("status").default('new'),
  priority: priorityEnum("priority").default('P2'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  accountId: uuid("account_id").references(() => accounts.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  leadId: uuid("lead_id").references(() => leads.id),
  title: varchar("title", { length: 255 }).notNull(),
  stage: varchar("stage").notNull(),
  amount: real("amount"),
  currency: varchar("currency"),
  closeDate: timestamp("close_date"),
  ownerId: varchar("owner_id").references(() => users.id),
  probability: integer("probability"),
  priority: priorityEnum("priority").default('P2'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").notNull(),
  winProbability: integer("win_probability"),
});

// Marketplace tables
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: real("base_price").notNull(),
  category: varchar("category").notNull(),
  isActive: boolean("is_active").default(true),
});

export const serviceOptions = pgTable("service_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  name: varchar("name", { length: 255 }).notNull(),
  priceDelta: real("price_delta").default(0),
});

export const servicePackages = pgTable("service_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  name: varchar("name", { length: 255 }).notNull(),
  tiers: text("tiers").array(), // S,M,L
  contents: jsonb("contents"),
  basePrice: real("base_price").notNull(),
});

export const orgServiceOrders = pgTable("org_service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  options: jsonb("options"),
  quantity: integer("quantity").default(1),
  status: orderStatusEnum("status").default('REQUESTED'),
  assigneeVendorUserId: varchar("assignee_vendor_user_id").references(() => users.id),
  total: real("total"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat tables
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: conversationStatusEnum("status").default('OPEN'),
  channel: channelEnum("channel").default('WIDGET'),
  assigneeId: varchar("assignee_id").references(() => users.id),
  escalatedAt: timestamp("escalated_at"),
  closedAt: timestamp("closed_at"),
  subject: varchar("subject"),
  priority: priorityEnum("priority").default('P2'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").references(() => users.id),
  senderType: varchar("sender_type").notNull(), // 'user', 'agent', 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentPresence = pgTable("agent_presence", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  status: agentPresenceStatusEnum("status").default('OFFLINE'),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  maxConcurrentChats: integer("max_concurrent_chats").default(5),
  currentChatCount: integer("current_chat_count").default(0),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  campaigns: many(campaigns),
  leads: many(leads),
  opportunities: many(opportunities),
  assets: many(assets),
  audiences: many(audiences),
  orders: many(orgServiceOrders),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [campaigns.organizationId],
    references: [organizations.id],
  }),
  channels: many(campaignChannels),
  tasks: many(marketingTasks),
  metrics: many(marketingMetrics),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  organization: one(organizations, {
    fields: [leads.organizationId],
    references: [organizations.id],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  organization: one(organizations, {
    fields: [opportunities.organizationId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
  contact: one(contacts, {
    fields: [opportunities.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [opportunities.leadId],
    references: [leads.id],
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingTaskSchema = createInsertSchema(marketingTasks).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAssetLinkSchema = createInsertSchema(assetLinks).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type MarketingTask = typeof marketingTasks.$inferSelect;
export type InsertMarketingTask = z.infer<typeof insertMarketingTaskSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type Asset = typeof assets.$inferSelect;
export type Service = typeof services.$inferSelect;
export type OrgServiceOrder = typeof orgServiceOrders.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type AgentPresence = typeof agentPresence.$inferSelect;
export type AssetLink = typeof assetLinks.$inferSelect;
export type InsertAssetLink = z.infer<typeof insertAssetLinkSchema>;
