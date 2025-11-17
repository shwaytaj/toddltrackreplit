# Toddl - Developmental Milestone Tracking Application

## Overview

Toddl is a comprehensive child development tracking application designed to help parents monitor their children's growth milestones and physical development. It provides AI-powered guidance within a nurturing, data-confident interface, balancing emotional warmth with professional health tracking for children from birth through early childhood. The project aims to provide evidence-based guidance by integrating milestone data from multiple international health organizations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Vite, Wouter (routing), TanStack Query (server state), Tailwind CSS.
**UI Component System:** Radix UI primitives, shadcn/ui (New York style), custom theme with light/dark mode, inspired by leading health/parenting apps.
**Design System:** DM Sans (body), Fredoka (accent), soft lavender palette, custom CSS variables, elevation system.
**State Management:** TanStack Query for server state, session-based for authentication, React Hook Form with Zod for forms.

### Backend Architecture

**Server Framework:** Express.js with TypeScript, session-based authentication using `express-session` and Passport.js (Local Strategy), BCrypt for hashing.
**Session Management:** PostgreSQL-backed sessions using `connect-pg-simple` for production/Autoscale deployments (required for multi-instance session sharing). In-memory store for development.
**API Design:** RESTful endpoints, JSON format, session cookies for authentication.
**Key API Routes:** `/api/auth/*`, `/api/children/*`, `/api/milestones/*`, `/api/children/:id/growth-metrics`, `/api/children/:childId/milestones/:milestoneId/recommendations`.

### Data Storage

**Database:** PostgreSQL via Neon serverless, Drizzle ORM.
**Schema Design:** `users`, `children`, `milestones`, `childMilestones`, `growthMetrics`, `teeth`, `aiRecommendations` and `aiToyRecommendations`. Uses JSONB for flexible medical history and UUIDs for primary keys.
**Data Patterns:** JSONB fields, UUIDs, array fields for parent-child relationships, timestamp tracking.

### Authentication & Authorization

**Authentication Flow:** Email-based authentication using Passport Local Strategy with bcrypt. Session serialization/deserialization by user ID, server-side session storage. Secure cookies (`httpOnly: true`, `sameSite: "lax"`) for production.
**Authorization:** Parent-child relationship verification, session-based user context, query-level access control.

### Key Features and Implementations

**Canonical Milestone System (Nov 2025):** Single source of truth approach using `dev-milestones-comprehensive.md` for all milestone titles. Implemented shared title normalization across all parsers, staged migration preserving child progress (457 canonical + 123 legacy milestones). Database includes `isLegacy` field (NULL-safe filtering treating NULL as false). Validation script ensures cross-file title consistency.
**Corrected Age Calculation:** Implemented for premature/post-mature births, automatically stops after 36 months chronological age. Affects milestone filtering and data display.
**Multi-Source Milestone Filtering:** Integrates milestone data from 7 international health organizations (CDC/AAP, HSE, WHO, NHS, Australian Dept of Health, Health Canada/CPS, South Africa DoH). Users can select preferred sources in settings. Backend filtering applied to all milestone endpoints (`/api/milestones`, `/api/milestones/age-range`). TanStack Query cache invalidation ensures Home and Milestones pages auto-update when source preferences change. **Database Sync (Nov 2025):** Database synced to use `dev-milestones-comprehensive_1762125221739.md` as the single source of truth (612 canonical milestones: 458 Developmental, 39 Growth, 42 Hearing, 27 Teeth, 46 Vision). Removed 211 non-canonical milestones including WHO growth standards. Created `sync-database-with-comprehensive.ts` script for authoritative sync. Updated source mappings using `milestones-categorised-by-source_1762125221739.md`. Source coverage: 96.3% Developmental, 100% Growth, 90.5% Hearing, 96.3% Teeth, 97.8% Vision. Fixed Postgres text[] array parsing for both milestone sources and user preferences with `parsePostgresArray()` helper. Corrected filtering logic to exclude milestones without sources when user has source preferences (previously included all sourceless milestones). **Detailed Descriptions (Nov 2025):** Loaded 571 detailed milestone descriptions from `milestones-descriptions_1762125221739.md` into database (100% success rate). Created `load-milestone-descriptions.ts` script with enhanced title normalization handling age prefixes, markdown markers, parentheticals, commas, and punctuation variations. Descriptions follow structured format with **About**, **What to look for**, **Why it matters** sections parsed by `milestone-description-parser.ts` and displayed in collapsible sections on MilestoneDetail page. Includes evidence-based content with citations from AAO, WHO, CDC, AAP and other authoritative sources.
**AI Recommendations & Caching:** Personalized developmental and toy recommendations generated by Anthropic Claude API, cached in the database (`aiToyRecommendations`) to reduce API calls and improve performance. Cache invalidation based on medical history updates.
**Evidence-Based Citations:** AI recommendations include citations from authoritative pediatric sources (CDC, AAP, WHO, etc.) with URL validation, stored with recommendations, and displayed in the frontend.
**UI/UX Improvements:** Streamlined `MilestoneDetail` page with collapsible "About" section and direct access to "Activities" and "Toys & Tools" tabs.

## External Dependencies

**AI Integration:** Anthropic Claude API (for recommendations).
**WHO Growth Standards:** Used for accurate percentile calculations for growth metrics (weight, height, head circumference).
**Development Tools:** Replit-specific plugins (Cartographer, runtime error overlay).
**Third-Party UI Libraries:** Google Fonts (DM Sans, Fredoka), React Icons, Lucide React, Vaul (drawers), CMDK (command palette), Recharts (charts).
**Build & Deployment:** ESBuild (server bundling), PostCSS with Autoprefixer, TypeScript compilation.