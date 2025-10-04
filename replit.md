# Toddl - Developmental Milestone Tracking Application

## Overview

Toddl is a comprehensive child development tracking application that helps parents monitor their children's growth milestones, physical development metrics, and receive AI-powered guidance. The application provides a nurturing, data-confident interface that balances emotional warmth with professional health tracking, designed specifically for parents tracking developmental progress from birth through early childhood.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS for utility-first styling with custom design system

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York style variant)
- Custom theme system with light/dark mode support via CSS variables
- Design philosophy based on health/parenting app leaders (Headspace, Flo, BabyCenter)

**Design System:**
- Primary fonts: DM Sans (body), Fredoka (accent/headers)
- Color palette: Soft lavender (primary), mint green (achievements), soft pink (alerts), navy blue (text)
- Custom CSS variables for theming with HSL color values
- Elevation system using opacity-based overlays (--elevate-1, --elevate-2)

**State Management:**
- Server state: TanStack Query with React hooks
- Authentication state: Session-based with query invalidation
- Form state: React Hook Form with Zod validation

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using express-session
- Passport.js with Local Strategy for username/password auth
- BCrypt for password hashing

**API Design:**
- RESTful endpoints organized by resource
- Session cookies for authentication (30-day expiry)
- JSON request/response format
- Credential-based fetch for API requests from frontend

**Key API Routes:**
- `/api/auth/*` - Authentication (register, login, logout)
- `/api/children/*` - Child profile management
- `/api/milestones/*` - Milestone data and tracking
- `/api/children/:id/growth-metrics` - Growth tracking (weight, height, head circumference)
- `/api/children/:childId/milestones/:milestoneId/recommendations` - AI-powered guidance

### Data Storage

**Database:**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database queries
- WebSocket connection pooling for serverless environment

**Schema Design:**
- `users` - Parent accounts with medical history (JSONB)
- `children` - Child profiles with birth date, gender, medical history
- `milestones` - Developmental milestone definitions with age ranges and categories
- `childMilestones` - Tracking of achieved milestones per child
- `growthMetrics` - Physical measurements (weight, height, head circumference) with WHO percentile calculations
- `teeth` - Dental development tracking
- `aiRecommendations` - Cached AI-generated guidance

**Data Patterns:**
- JSONB fields for flexible medical history storage
- UUID primary keys (gen_random_uuid)
- Array fields for parent-child relationships (supports multiple parents)
- Timestamp tracking for medical history updates

### Authentication & Authorization

**Authentication Flow:**
- Email-based authentication (migrated from username-based)
- Passport Local Strategy with bcrypt password hashing (10 rounds)
- LocalStrategy configured with usernameField: 'email'
- Session serialization/deserialization by user ID
- Session stored server-side with configurable secret
- Secure cookies in production environment

**Authorization:**
- Parent-child relationship verification via parentIds array
- Session-based user context available on all authenticated routes
- Query-level access control in storage layer

**Recent Auth Migration (Oct 2025):**
- Database column renamed: users.username → users.email
- insertUserSchema updated to use email field
- All auth routes (register/login) now use email instead of username

**Recent Home Page Fixes (Oct 2025):**
- Fixed Home page to display real child data instead of hardcoded mock data
- Implemented accurate age calculation handling all edge cases (month-end birthdays, 0-month children)
- Added proper React Query guards to prevent erroneous API calls before prerequisites ready
- Age calculation verified working correctly: birthdate → months & days display
- All data now fetched from backend: child name, age, milestones, growth metrics, achievements

### External Dependencies

**AI Integration:**
- Anthropic Claude API for generating personalized developmental recommendations
- Used for milestone-specific guidance based on child's age and progress
- Recommendations cached in database to reduce API calls

**WHO Growth Standards:**
- WHO Child Growth Standards LMS method for percentile calculations
- Embedded growth chart data for boys and girls (0-60 months)
- Box-Cox transformation for accurate percentile computation
- Supports weight, height, and head circumference metrics

**Development Tools:**
- Replit-specific plugins for development environment
- Runtime error overlay for debugging
- Cartographer for code mapping
- Development banner for environment indication

**Third-Party UI Libraries:**
- Google Fonts: DM Sans and Fredoka typefaces
- React Icons for social login buttons
- Lucide React for general iconography
- Vaul for drawer components
- CMDK for command palette functionality
- Recharts for growth chart visualizations

**Build & Deployment:**
- ESBuild for server bundling
- PostCSS with Autoprefixer for CSS processing
- TypeScript compilation with path aliases (@/, @shared/, @assets/)
- Environment-specific configurations (NODE_ENV, DATABASE_URL, SESSION_SECRET, ANTHROPIC_API_KEY)