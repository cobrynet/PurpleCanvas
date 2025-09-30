# Stratikey - B2B Multi-Tenant Marketing & Sales Platform

## Overview

Stratikey is a comprehensive B2B multi-tenant platform designed for autonomous marketing and sales management with an integrated services marketplace. The application provides organizations with tools to manage campaigns, leads, opportunities, tasks, and access external services through a unified interface.

The platform features role-based access control with different permission levels (SUPER_ADMIN, ORG_ADMIN, MARKETER, SALES, VIEWER) and supports multiple organizations per user. The system is built with a modern tech stack focusing on performance, scalability, and user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (September 30, 2025)

### Critical Bug Fix: Goal Creation and Task Generation Flow
**Issue**: Tasks were not being generated after goal creation despite successful API responses.

**Root Cause**: The `apiRequest()` utility function returns a `Response` object, not parsed JSON. The Goals page was trying to access `data.goalId` directly from the Response object, resulting in `undefined`. This prevented the task generation endpoint from being called.

**Resolution**: 
- Updated `Goals.tsx` to parse JSON responses: `const response = await apiRequest(...); return await response.json();`
- Applied to both goal creation and task generation API calls
- Tasks now correctly generate and persist with proper `module`, `goalId`, and `organizationId` fields

**Impact**: Complete end-to-end flow now works: goal creation → task generation → task display in /tasks and filtered views in Marketing/CRM pages.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with role-based page access
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state and form management with React Hook Form
- **Design Patterns**: Component composition with reusable UI components, custom hooks for data fetching and authentication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with session-based authentication
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Structure**: Monorepo with shared schema between client and server

### Authentication & Authorization
- **Dual Authentication System**: Supports both email/password and Replit OAuth authentication methods
- **Email/Password Auth**: Passport.js LocalStrategy with bcrypt password hashing (12 rounds)
- **OAuth Integration**: Replit OAuth with OpenID Connect for seamless platform integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple with secure cookie settings
- **Security Features**: Zod server-side validation, user enumeration prevention, session regeneration
- **Authorization Pattern**: Role-based access control with middleware protection
- **User Management**: Multi-tenant user system with automatic organization creation and membership assignment
- **Onboarding Flow**: Automatic organization creation with ORG_ADMIN role assignment for new users

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema definitions
- **Connection Pooling**: Neon serverless connection pooling
- **Data Validation**: Zod schemas for runtime type checking and form validation

### Business Logic Organization
- **Multi-tenancy**: Organization-based data isolation with membership roles
- **Core Entities**: Users, Organizations, Campaigns, Leads, Opportunities, Marketing Tasks, Assets, Services
- **Permission Model**: Hierarchical permissions with organization-level access control
- **Data Relationships**: Normalized schema with foreign key constraints and proper indexing
- **Goal-Driven Task Management**: Automatic task generation from business goals with GoalPlan specifications
  - Tasks linked to goals via goalId and module fields (marketing, marketing_adv, marketing_offline, crm)
  - Task filtering in UI based on goal and module context
  - Integration between Goals, Marketing, CRM, and Task Manager pages

## External Dependencies

### Third-Party Services
- **Replit Auth**: OAuth authentication provider with OpenID Connect
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Stripe**: Payment processing integration for marketplace transactions

### Frontend Libraries
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Charts**: Recharts for data visualization and analytics dashboards
- **Form Handling**: React Hook Form with Hookform Resolvers for validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver and Neon serverless client
- **Authentication**: Passport.js with OpenID Client strategy for OAuth
- **Session Management**: Express Session with PostgreSQL store
- **Validation**: Zod for schema validation and type safety

### Development Tools
- **Build System**: Vite for frontend bundling and ESBuild for backend compilation
- **Type Checking**: TypeScript with strict configuration
- **Development**: TSX for server development with hot reloading
- **Replit Integration**: Specialized plugins for Replit development environment