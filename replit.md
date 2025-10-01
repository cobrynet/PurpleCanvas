# Stratikey - B2B Multi-Tenant Marketing & Sales Platform

## Overview

Stratikey is a comprehensive B2B multi-tenant platform designed for autonomous marketing and sales management with an integrated services marketplace. The platform enables organizations to manage campaigns, leads, opportunities, and tasks, and to access external services through a unified interface. It supports role-based access control (SUPER_ADMIN, ORG_ADMIN, MARKETER, SALES, VIEWER) and multiple organizations per user, built with a focus on performance, scalability, and user experience. The project aims to provide a robust solution for B2B marketing and sales, enhancing efficiency and strategic planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a modernized dark theme and layout components for improved readability and aesthetics. It uses custom CSS variables for both light and dark themes, with `AppLayout.tsx` and other layout components migrated to theme tokens. Typography is enhanced for readability, and modern utilities like shadow effects, transitions, and hover states are implemented. WCAG AA contrast compliance is ensured for all text elements.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, Wouter for routing, Radix UI components with shadcn/ui design system, Tailwind CSS for styling, TanStack Query for server state, and React Hook Form for forms.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design, and session-based authentication.
- **Authentication & Authorization**: Dual system supporting email/password (Passport.js with bcrypt) and Replit OAuth (OpenID Connect). Session management uses Express sessions with PostgreSQL storage. Role-based access control (RBAC) with middleware protection and Zod server-side validation are implemented.
- **Data Storage**: PostgreSQL with Neon serverless driver, Drizzle ORM for schema management and migrations, and Drizzle Kit. Zod schemas ensure runtime type checking and validation.
- **Multi-tenancy**: Data isolation based on organizations with hierarchical permissions and organization-level access control.
- **Error Handling**: Standardized error format with consistent API error responses, integrated with RBAC and rate limiters. Client-side retry logic with exponential backoff and user-friendly error toasts.
- **Performance Optimizations**: HTTP caching with `Cache-Control` headers for authenticated endpoints and `Vary: Cookie` for session-based authentication. Lazy loading for images using `IntersectionObserver`.
- **AI-Powered Features**: AI-powered strategy generation for business goals using OpenAI, and PDF document creation using PDFKit for strategic plans.
- **GDPR Compliance**: Features for user data export and deletion requests with a confirmation flow and 30-day grace period.
- **Subscription Management**: Integration with Stripe for billing, including subscription plans with limits (users, assets, posts) enforced at various points in the application.
- **Custom Domain Management**: Allows organizations to manage custom domains with CNAME verification.
- **CI/CD**: Pre-commit checks using a `ci-checks.sh` script for TypeScript type checking and linting.

### Feature Specifications
- **Core Entities**: Users, Organizations, Campaigns, Leads, Opportunities, Marketing Tasks, Assets, Services.
- **Goal-Driven Task Management**: Automatic task generation from business goals with tasks linked to goals and modules (marketing, crm).
- **Enhanced Task Management**: Marketing tasks include mandatory descriptions and social media-specific fields (caption, postType).

## External Dependencies

### Third-Party Services
- **Replit Auth**: OAuth authentication provider with OpenID Connect.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Stripe**: Payment processing for marketplace transactions and subscription management.
- **OpenAI**: AI-powered strategy generation.

### Frontend Libraries
- **UI Components**: Radix UI, shadcn/ui.
- **Styling**: Tailwind CSS.
- **Charts**: Recharts.
- **Form Handling**: React Hook Form, Hookform Resolvers.

### Backend Dependencies
- **Database**: Drizzle ORM, PostgreSQL driver, Neon serverless client.
- **Authentication**: Passport.js, OpenID Client.
- **Session Management**: Express Session, connect-pg-simple.
- **Validation**: Zod.
- **PDF Generation**: PDFKit.

### Development Tools
- **Build System**: Vite, ESBuild.
- **Type Checking**: TypeScript.
- **Development**: TSX.