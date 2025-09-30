# Stratikey - B2B Multi-Tenant Marketing & Sales Platform

## Overview

Stratikey is a comprehensive B2B multi-tenant platform designed for autonomous marketing and sales management with an integrated services marketplace. The application provides organizations with tools to manage campaigns, leads, opportunities, tasks, and access external services through a unified interface.

The platform features role-based access control with different permission levels (SUPER_ADMIN, ORG_ADMIN, MARKETER, SALES, VIEWER) and supports multiple organizations per user. The system is built with a modern tech stack focusing on performance, scalability, and user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (September 30, 2025)

### Theme Modernization: Dark Mode Readability & Contrast
**Feature**: Complete overhaul of dark theme for improved readability and modern aesthetics.

**Implementation**:
- **Balanced Purple Palette**: Background changed from near-black (hsl(304, 100%, 8%)) to balanced dark purple (hsl(280, 40%, 12%))
- **High Contrast Text**: Foreground updated to bright white (hsl(0, 0%, 98%)) ensuring WCAG AA compliance
- **Readable Cards**: Card backgrounds lightened to hsl(280, 35%, 18%) for better content visibility
- **Vibrant Accents**: Primary accent enhanced to vivid pink (hsl(321, 70%, 55%)) for better visibility
- **Typography Enhancements**: Added base styles for h1-h6, paragraphs, labels with proper sizing and spacing
- **Modern Utility Classes**: Updated theme utilities with transitions, shadows, and hover effects

**Technical Details**:
- All CSS variables in client/src/index.css .dark class updated
- Base layer styles enhanced for semantic HTML elements
- Component layer utilities modernized with accessibility focus
- Muted text color (hsl(0, 0%, 75%)) ensures secondary text remains readable

### New Feature: AI-Powered Strategy PDF Generation
**Feature**: Automatic generation of strategic planning documents from business goals using OpenAI and PDF export capabilities.

**Implementation**:
- **AI Strategy Generation**: POST /api/goals/:goalId/ai-plan endpoint uses OpenAI to analyze business goals and generate comprehensive strategic plans including marketing, offline, and sales strategies
- **PDF Document Creation**: POST /api/goals/:goalId/strategy-pdf endpoint generates professionally formatted PDF documents using PDFKit library with goal details and AI-generated strategy
- **Secure Download**: GET /api/goals/:goalId/strategy.pdf endpoint provides authenticated PDF download using ObjectStorageService with proper path normalization
- **Frontend Integration**: Goals.tsx now displays conditional "Genera Piano AI" or "Scarica Piano" buttons based on strategy generation status

**Technical Details**:
- PDFKit library added for server-side PDF generation
- Object storage integration for secure file storage with organization-scoped paths
- Database schema updated: business_goals table now includes `aiPlan` (text), `strategyPdfUrl` (text), and `strategyGeneratedAt` (timestamp)
- Storage interface enhanced with `updateBusinessGoal` method for partial goal updates

### New Feature: Enhanced Task Management with Descriptions and Social Fields
**Feature**: All marketing tasks now include mandatory descriptions and social media-specific fields for better content planning.

**Implementation**:
- **Task Descriptions**: All tasks now require a `description` field (text, required) that provides detailed context
- **Social Media Fields**: Tasks include optional `caption` (text) for social post content and `postType` (enum: foto/video/carosello) for post format
- **Task Detail Dialog**: New comprehensive dialog in Tasks.tsx for viewing and editing all task fields including social-specific ones
- **Automatic Generation**: All task generation endpoints updated to automatically include contextual descriptions based on task type and goal context

**Technical Details**:
- Database schema updated: marketing_tasks table includes `description` (text, required), `caption` (text), `postType` (enum)
- New endpoints: GET /api/tasks/:id (fetch single task), PATCH /api/tasks/:id (update task with validation)
- Frontend enhancements: Task detail dialog with view/edit modes, form validation using updateMarketingTaskSchema
- All existing tasks (1055+) updated with contextual descriptions

**Bug Fixes**:
- Fixed PDF download object storage path resolution using ObjectStorageService.normalizeObjectEntityPath()
- Added missing type definitions for updateBusinessGoal in IStorage interface
- Resolved import issues for Loader2 icon component

### Previous Bug Fix: Goal Creation and Task Generation Flow
**Issue**: Tasks were not being generated after goal creation despite successful API responses.

**Resolution**: Updated Goals.tsx to properly parse JSON responses from apiRequest() utility. Tasks now correctly generate and persist with proper module, goalId, and organizationId fields.

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