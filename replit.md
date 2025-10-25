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
- `children` - Child profiles with birth date, due date (for corrected age), gender, medical history
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

**Production Authentication Fix (Oct 2025):**
- Fixed production login redirect issue where users were redirected to signup page after successful login
- Updated queryClient to properly read `meta.unauthorizedBehavior` from query options
- This allows `useUser` hook to return null on 401 errors instead of throwing, preventing unwanted redirects
- Enhanced session cookie configuration with `httpOnly: true` and `sameSite: "lax"`
- Removed `secure` flag to ensure sessions work reliably in Replit's production environment
- Session cookies persist across navigation (registration → onboarding → home)
- Authentication flow verified end-to-end with Playwright testing

**Recent Home Page Fixes (Oct 2025):**
- Fixed Home page to display real child data instead of hardcoded mock data
- Implemented accurate age calculation handling all edge cases (month-end birthdays, 0-month children)
- Added proper React Query guards to prevent erroneous API calls before prerequisites ready
- Age calculation verified working correctly: birthdate → months & days display
- All data now fetched from backend: child name, age, milestones, growth metrics, achievements

**Toy Recommendations Enhancements (Oct 2025):**
- Replaced retailer button text with company logos (Amazon, Target, Walmart) using react-icons
- Implemented dismissible recommendations system with database persistence per child
- Created `dismissed_toy_recommendations` table to track user dismissals
- Backend generates 10-15 toy recommendations, filters dismissed ones, returns up to 5 fresh recommendations
- Added tooltip "Don't show this" on hover over close button for each recommendation (inline with toy title)
- Implemented auto-refetch when recommendations are dismissed, with "No more recommendations" placeholder
- Enhanced Amazon URLs with multiple parameters: category filtering, age-appropriate filtering, review-based sorting

**Milestone Data Seeding (Oct 2025):**
- Comprehensive developmental milestone data added for all age ranges (0-60 months)
- Age ranges: 0-3, 4-6, 7-9, 10-12, 13-18, 19-24, 25-30, 31-36, 37-49, 49-60 months
- Categories: Gross Motor (23 milestones), Fine Motor (16), Communication (18), Social & Emotional (15), Cognitive (12), Vision (4), Hearing (4)
- Total: 92 developmental milestones based on CDC and AAP guidelines
- Frontend age-range logic updated to properly handle children 48-60+ months
- Milestones use overlapping ranges to ensure all child ages have appropriate guidance
- Dismissed toys filtered using case-insensitive matching
- **Caching Implementation**: Created `aiToyRecommendations` table to cache AI-generated toy recommendations
- Cached recommendations are reused until medical history is updated, significantly reducing load times
- Cache invalidation based on child and parent medical history version timestamps
- Similar caching pattern to to-do recommendations for consistent performance

**Corrected Age Implementation (Oct 2025):**
- Added `dueDate` field to children schema for tracking original due date
- Created shared age calculation utility (`client/src/lib/age-calculation.ts`) for consistent corrected age logic across the app
- **Calculation Logic**: Corrected Age = Chronological Age - (adjustment weeks / 4.345 weeks per month)
- Supports both premature birth (born before due date) and post-mature birth (born after due date)
- Automatically stops using corrected age after 36 months chronological age per pediatric guidelines
- Falls back to chronological age if no due date is provided
- **Onboarding Flow**: Updated to capture both original due date and actual birth date as mandatory fields
- **Medical History Page**: Displays both dates with real-time adjustment calculation showing weeks premature/post-mature
- **Home Page**: Shows both chronological and corrected ages when applicable, uses corrected age for milestone filtering
- **Cache Invalidation**: Date changes in medical history trigger invalidation of all milestone-related queries
- Backend PATCH route accepts `dueDate` parameter for updating child profiles
- All milestone filtering throughout the app uses corrected age to ensure developmentally appropriate guidance

**Evidence-Based Citations System (Oct 2025):**
- Added citations to all AI recommendations to show evidence-based sources (CDC, AAP, WHO)
- **Schema Updates**: Added `citations` JSONB field to `completedRecommendations`, `aiRecommendations`, and `aiToyRecommendations` tables
- **AI Prompts**: Updated both Guide and Toy recommendation prompts to explicitly request citations from authoritative sources
- **Citation Format**: Each citation includes `source` (required) and `url` (optional) fields
- **Frontend Display**: Citations appear as small badges using design tokens (bg-muted, text-muted-foreground, border-border) for proper dark mode support
- **Persistence**: Citations are stored with completed recommendations so they remain visible even after new recommendations are fetched
- **Backend**: Routes updated to accept and store citations when marking recommendations as complete
- **Testing**: All citation elements have data-testid attributes for accessibility and testing
- **Documentation**: Created `AI_PROMPT_DOCUMENTATION.md` showing exact prompts sent to Claude for verification

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