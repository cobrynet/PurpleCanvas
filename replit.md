# Stratikey - B2B Multi-Tenant Marketing & Sales Platform

## Overview

Stratikey is a comprehensive B2B multi-tenant platform designed for autonomous marketing and sales management with an integrated services marketplace. The platform enables organizations to manage campaigns, leads, opportunities, and tasks, and to access external services through a unified interface. It supports role-based access control (SUPER_ADMIN, ORG_ADMIN, MARKETER, SALES, VIEWER, VENDOR) and multiple organizations per user, built with a focus on performance, scalability, and user experience. The project aims to provide a robust solution for B2B marketing and sales, enhancing efficiency and strategic planning.

## Recent Updates (October 2025)

### B12 - Vendor Console & SLA-Tracked Marketplace Orders
- **Backend**: Full vendor order management system with deliverable status tracking (PENDING, READY_FOR_REVIEW, DELIVERED, CHANGES_REQUESTED, APPROVED), SLA deadline tracking, automatic notifications to ORG_ADMIN on status changes
- **Frontend**: Vendor Console UI at `/vendor` with role-based access control, SLA visualization (met/pending/overdue), order list with status updates, comprehensive error handling
- **RBAC**: Added VENDOR role with minimal permissions (marketplace read only, scoped to assigned orders)

### B13 - Approval Workflows for Marketing Content
- **Backend**: Approval system for assets and marketing tasks with approval status (PENDING, IN_REVIEW, APPROVED, CHANGES_REQUESTED), approval gate enforcement preventing publication of unapproved content
- **Frontend**: ApprovalActions component for managing approvals, TaskApprovalBadge for status display, integration into marketing workflow
- **Security**: Server-side approval gate checks before publishing social posts with linked assets

### B14 - Accessibility & Responsive Design
- **Accessibility**: Global :focus-visible focus rings for keyboard navigation, comprehensive ARIA labels using i18n translation keys, skip-to-main-content link for screen readers
- **Responsive Design**: Mobile-first responsive sidebar with overlay and toggle button, works from 360px viewport width, fluid layouts across all breakpoints
- **WCAG Compliance**: AA-level contrast compliance verified for purple theme, proper semantic HTML structure

### B15 - Internationalization (IT/EN)
- **i18n System**: Lightweight React Context-based localization with Italian (default) and English support, IT fallback for missing translations
- **Coverage**: All structural UI strings internationalized including navigation, header controls, ARIA labels, settings page
- **Language Switching**: Integrated language switcher in Settings page with localStorage persistence and HTML lang attribute sync
- **Translation Structure**: Organized keys (nav.*, header.*, a11y.*, settings.*, common.*) in translations.ts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a modernized dark theme and layout components for improved readability and aesthetics. It uses custom CSS variables for both light and dark themes, with `AppLayout.tsx` and other layout components migrated to theme tokens. Typography is enhanced for readability, and modern utilities like shadow effects, transitions, and hover states are implemented. WCAG AA contrast compliance is ensured for all text elements. The platform is fully responsive from 360px viewport width with mobile-optimized navigation and comprehensive keyboard accessibility support.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, Wouter for routing, Radix UI components with shadcn/ui design system, Tailwind CSS for styling, TanStack Query for server state, React Hook Form for forms, and React Context for i18n (IT/EN).
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