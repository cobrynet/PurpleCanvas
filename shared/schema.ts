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
export const periodicityEnum = pgEnum('periodicity', ['ANNUALE', 'SEMESTRALE', 'QUADRIMESTRALE']);
export const budgetCategoryEnum = pgEnum('budget_category', ['SOCIAL_ADS', 'FIERE', 'COMMERCIALE', 'ALTRO']);
export const offlineActivityTypeEnum = pgEnum('offline_activity_type', ['FIERA', 'EVENTO', 'STAMPA', 'PR', 'SPONSORSHIP', 'DIRECT_MAIL', 'RADIO', 'TV', 'OUTDOOR', 'ALTRO']);
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
export const postTypeEnum = pgEnum('post_type', ['PHOTO', 'VIDEO', 'CAROUSEL']);
export const planTierEnum = pgEnum('plan_tier', ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']);
export const domainStatusEnum = pgEnum('domain_status', ['PENDING', 'VERIFIED', 'ACTIVE', 'FAILED']);
export const deletionStatusEnum = pgEnum('deletion_status', ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED']);

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

// User storage table (supports both Replit Auth and email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For email/password auth (hashed with bcrypt)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  settings: jsonb("settings"), // User personal settings (notifications, language, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Core multi-tenant tables
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }),
  billingCustomerId: varchar("billing_customer_id"),
  settings: jsonb("settings"), // Organization settings (branding, domain, workflows, etc.)
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
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
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
  leadId: uuid("lead_id").references(() => leads.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  goalId: uuid("goal_id").references(() => businessGoals.id),
  module: varchar("module"), // marketing, marketing_adv, marketing_offline, crm
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(),
  subtype: varchar("subtype"),
  caption: text("caption"),
  postType: postTypeEnum("post_type"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  status: taskStatusEnum("status").default('BACKLOG'),
  priority: priorityEnum("priority").default('P2'),
  dueAt: timestamp("due_at"),
  metadata: jsonb("metadata"), // Extra fields like channel, week number, etc.
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

// Offline Activities
export const offlineActivities = pgTable("offline_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: offlineActivityTypeEnum("type").notNull(),
  activityDate: timestamp("activity_date").notNull(),
  budget: integer("budget"), // in centesimi, optional
  description: text("description"),
  assetIds: jsonb("asset_ids"), // array of asset IDs for attachments
  taskId: uuid("task_id").references(() => marketingTasks.id), // connected marketing task
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Business Goals tables
export const businessGoals = pgTable("business_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  salesPipeline: text("sales_pipeline"),
  fairs: text("fairs"),
  digitalChannels: text("digital_channels"),
  adInvestments: text("ad_investments"),
  geoArea: text("geo_area"),
  sector: text("sector"),
  preferredChannels: text("preferred_channels").array(),
  periodicity: periodicityEnum("periodicity").notNull(),
  objectives: text("objectives").notNull(),
  totalBudget: integer("total_budget").notNull(), // in centesimi
  aiPlan: jsonb("ai_plan"),
  strategyPdfUrl: varchar("strategy_pdf_url"),
  strategyGeneratedAt: timestamp("strategy_generated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalAttachments = pgTable("goal_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().references(() => businessGoals.id),
  assetId: uuid("asset_id").references(() => assets.id),
  fileUrl: text("file_url"),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetAllocations = pgTable("budget_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().references(() => businessGoals.id),
  category: budgetCategoryEnum("category").notNull(),
  amount: integer("amount").notNull(), // in centesimi
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalPlans = pgTable("goal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().unique().references(() => businessGoals.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  spec: jsonb("spec").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").default('INFO'),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
  index("idx_notifications_organization").on(table.organizationId)
]);

// Subscription Plans (B7)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  tier: planTierEnum("tier").notNull(),
  stripePriceId: varchar("stripe_price_id"),
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxAssets: integer("max_assets").notNull(),
  maxPostsPerMonth: integer("max_posts_per_month").notNull(),
  features: jsonb("features"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization Subscriptions (B7)
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  status: varchar("status").notNull().default('active'),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Domains (B8)
export const orgDomains = pgTable("org_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  status: domainStatusEnum("status").default('PENDING'),
  cnameTarget: varchar("cname_target", { length: 255 }),
  verificationToken: varchar("verification_token"),
  verifiedAt: timestamp("verified_at"),
  lastCheckedAt: timestamp("last_checked_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_domains_organization").on(table.organizationId),
  index("idx_org_domains_status").on(table.status)
]);

// User Deletion Requests (B9 - GDPR)
export const userDeletionRequests = pgTable("user_deletion_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestorEmail: varchar("requestor_email").notNull(),
  status: deletionStatusEnum("status").default('PENDING'),
  confirmationToken: varchar("confirmation_token"),
  confirmedAt: timestamp("confirmed_at"),
  scheduledPurgeAt: timestamp("scheduled_purge_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Strategy Drafts (B10 - AI Strategy Generation)
export const strategyDrafts = pgTable("strategy_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  goalId: uuid("goal_id").references(() => businessGoals.id),
  title: varchar("title", { length: 255 }).notNull(),
  strategicSummary: text("strategic_summary"),
  marketingStrategy: text("marketing_strategy"),
  salesStrategy: text("sales_strategy"),
  quarterlyRoadmap: jsonb("quarterly_roadmap"),
  generatedTasks: jsonb("generated_tasks"),
  sourceDocuments: jsonb("source_documents"),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_strategy_drafts_organization").on(table.organizationId),
  index("idx_strategy_drafts_goal").on(table.goalId)
]);

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  notifications: many(notifications),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  campaigns: many(campaigns),
  leads: many(leads),
  opportunities: many(opportunities),
  assets: many(assets),
  audiences: many(audiences),
  orders: many(orgServiceOrders),
  businessGoals: many(businessGoals),
  notifications: many(notifications),
}));

export const businessGoalsRelations = relations(businessGoals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [businessGoals.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [businessGoals.createdByUserId],
    references: [users.id],
  }),
  attachments: many(goalAttachments),
  allocations: many(budgetAllocations),
}));

export const goalAttachmentsRelations = relations(goalAttachments, ({ one }) => ({
  goal: one(businessGoals, {
    fields: [goalAttachments.goalId],
    references: [businessGoals.id],
  }),
  asset: one(assets, {
    fields: [goalAttachments.assetId],
    references: [assets.id],
  }),
}));

export const budgetAllocationsRelations = relations(budgetAllocations, ({ one }) => ({
  goal: one(businessGoals, {
    fields: [budgetAllocations.goalId],
    references: [businessGoals.id],
  }),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
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
}).extend({
  startAt: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  endAt: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
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

export const updateMarketingTaskSchema = createInsertSchema(marketingTasks).omit({
  id: true,
  createdAt: true,
  organizationId: true,
}).partial();

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

export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({
  id: true,
  createdAt: true,
});

export const insertGoalAttachmentSchema = createInsertSchema(goalAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocations).omit({
  id: true,
  createdAt: true,
});

export const insertGoalPlanSchema = createInsertSchema(goalPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfflineActivitySchema = createInsertSchema(offlineActivities).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialConnectionSchema = createInsertSchema(socialConnections).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAgentPresenceSchema = createInsertSchema(agentPresence).omit({
  id: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Authentication schemas
export const authRegisterSchema = z.object({
  email: z.string().email("Formato email non valido"),
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nome è obbligatorio"),
  lastName: z.string().min(1, "Cognome è obbligatorio"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

export const authLoginSchema = z.object({
  email: z.string().email("Formato email non valido"),
  password: z.string().min(1, "Password è obbligatoria"),
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
export type UpdateMarketingTask = z.infer<typeof updateMarketingTaskSchema>;
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
export type InsertAgentPresence = z.infer<typeof insertAgentPresenceSchema>;
export type AssetLink = typeof assetLinks.$inferSelect;
export type InsertAssetLink = z.infer<typeof insertAssetLinkSchema>;
export type BusinessGoal = typeof businessGoals.$inferSelect;
export type InsertBusinessGoal = z.infer<typeof insertBusinessGoalSchema>;
export type GoalAttachment = typeof goalAttachments.$inferSelect;
export type InsertGoalAttachment = z.infer<typeof insertGoalAttachmentSchema>;
export type BudgetAllocation = typeof budgetAllocations.$inferSelect;
export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type GoalPlan = typeof goalPlans.$inferSelect;
export type InsertGoalPlan = z.infer<typeof insertGoalPlanSchema>;
export type OfflineActivity = typeof offlineActivities.$inferSelect;
export type InsertOfflineActivity = z.infer<typeof insertOfflineActivitySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = z.infer<typeof insertSocialConnectionSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuthRegister = z.infer<typeof authRegisterSchema>;
export type AuthLogin = z.infer<typeof authLoginSchema>;

// B7 - Subscription Plan schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type InsertOrganizationSubscription = z.infer<typeof insertOrganizationSubscriptionSchema>;

// B8 - Custom Domain schemas
export const insertOrgDomainSchema = createInsertSchema(orgDomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OrgDomain = typeof orgDomains.$inferSelect;
export type InsertOrgDomain = z.infer<typeof insertOrgDomainSchema>;

// B9 - User Deletion Request schemas
export const insertUserDeletionRequestSchema = createInsertSchema(userDeletionRequests).omit({
  id: true,
  createdAt: true,
});

export type UserDeletionRequest = typeof userDeletionRequests.$inferSelect;
export type InsertUserDeletionRequest = z.infer<typeof insertUserDeletionRequestSchema>;

// B10 - Strategy Draft schemas
export const insertStrategyDraftSchema = createInsertSchema(strategyDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type StrategyDraft = typeof strategyDrafts.$inferSelect;
export type InsertStrategyDraft = z.infer<typeof insertStrategyDraftSchema>;

// Settings schemas
export const userSettingsSchema = z.object({
  // Account preferences
  language: z.string().default('it'),
  timezone: z.string().default('Europe/Rome'),
  
  // Notification preferences
  notifications: z.object({
    email: z.object({
      campaigns: z.boolean().default(true),
      leads: z.boolean().default(true),
      tasks: z.boolean().default(true),
      opportunities: z.boolean().default(true),
    }),
    push: z.object({
      browser: z.boolean().default(true),
      mobile: z.boolean().default(false),
      desktop: z.boolean().default(true),
    }),
    sms: z.object({
      critical: z.boolean().default(false),
      reminders: z.boolean().default(false),
    }),
  }),
  
  // Interface preferences
  interface: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    dashboardLayout: z.string().default('default'),
    sidebarCollapsed: z.boolean().default(false),
  }),
});

export const organizationSettingsSchema = z.object({
  // Organization info
  organization: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    country: z.string().optional(),
    description: z.string().optional(),
  }),
  
  // Branding
  branding: z.object({
    logoUrl: z.string().optional(),
    brandColor: z.string().default('#390035'),
    customDomain: z.string().optional(),
    subdomain: z.string().optional(),
    sslEnabled: z.boolean().default(true),
  }),
  
  // Developer settings
  developer: z.object({
    apiKeys: z.array(z.object({
      id: z.string(),
      name: z.string(),
      key: z.string(),
      environment: z.enum(['development', 'production']),
      lastUsed: z.date().optional(),
      createdAt: z.date(),
    })).default([]),
    webhooks: z.object({
      url: z.string().optional(),
      events: z.array(z.string()).default([]),
      secret: z.string().optional(),
    }),
  }),
  
  // Workflow & Automazioni Offline
  workflows: z.object({
    automations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['event_based', 'time_based', 'condition_based']),
      trigger: z.object({
        type: z.string(),
        conditions: z.record(z.any()),
      }),
      actions: z.array(z.object({
        type: z.string(),
        config: z.record(z.any()),
      })),
      enabled: z.boolean().default(true),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
      createdAt: z.date(),
    })).default([]),
    
    // Configurazioni per task automatici
    taskAutomation: z.object({
      // Eventi entro 30gg = P1
      eventDeadlineEscalation: z.object({
        enabled: z.boolean().default(true),
        daysBefore: z.number().default(30),
        targetPriority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P1'),
      }),
      
      // Revisione brand per materiali stampati
      brandReviewReminder: z.object({
        enabled: z.boolean().default(true),
        triggerOnPrintMaterials: z.boolean().default(true),
        daysBefore: z.number().default(7),
        assignToRole: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER', 'SALES', 'VIEWER']).default('MARKETER'),
      }),
      
      // Lead follow-up automatico
      leadFollowUp: z.object({
        enabled: z.boolean().default(true),
        firstFollowUpHours: z.number().default(24),
        subsequentFollowUpDays: z.array(z.number()).default([3, 7, 14]),
      }),
      
      // Reminder scadenze opportunità
      opportunityReminders: z.object({
        enabled: z.boolean().default(true),
        reminderDays: z.array(z.number()).default([7, 3, 1]),
        escalateAfterDays: z.number().default(7),
      }),
    }),
  }),
  
  // User management
  userManagement: z.object({
    defaultRole: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER', 'SALES', 'VIEWER']).default('VIEWER'),
    allowSelfRegistration: z.boolean().default(false),
    requiredApproval: z.boolean().default(true),
  }),
});

// Settings types
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

// GoalPlan spec schema for AI generation validation
export const goalPlanSpecSchema = z.object({
  periodicity: z.enum(['ANNUALE', 'SEMESTRALE', 'QUADRIMESTRALE']),
  durationDays: z.number().min(1).max(365),
  marketing: z.object({
    organicPostsPerWeek: z.number().min(1).max(7),
    channels: z.array(z.string()).min(0),
    hasSocialAds: z.boolean(),
  }),
  offline: z.object({
    fairsBudgetCents: z.number().min(0),
    hasFairs: z.boolean(),
  }),
  sales: z.object({
    cadence: z.string(),
    targetLeadsPerMonth: z.number().min(0),
  }),
  notes: z.string().optional(),
});

export type GoalPlanSpec = z.infer<typeof goalPlanSpecSchema>;
