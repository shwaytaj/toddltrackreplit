# Toddl Design Guidelines

## Design Approach
**Reference-Based Approach** - Drawing inspiration from health and parenting app leaders (Headspace, Flo, BabyCenter, Huckleberry) while maintaining a unique, supportive identity for developmental tracking.

### Design Philosophy
Create a nurturing, data-confident interface that balances emotional warmth with professional health tracking. Parents need to feel supported, not overwhelmed by developmental data.

---

## Core Design Elements

### A. Color Palette

**Primary Colors (Light Mode)**
- Soft Lavender: 270 60% 85% - Primary brand, gentle milestones
- Mint Green: 150 50% 70% - Achievement indicators, positive actions
- Soft Pink: 340 70% 85% - Alert cards, attention items
- Navy Blue: 220 50% 25% - Primary text, headers
- Sky Blue: 200 60% 75% - Growth tracking accents

**Primary Colors (Dark Mode)**
- Deep Lavender: 270 40% 25% - Backgrounds
- Muted Mint: 150 30% 35% - Achievements
- Rose: 340 40% 30% - Alerts
- Off White: 220 10% 90% - Primary text
- Deep Blue: 200 35% 30% - Accents

**Supporting Colors**
- Warm Beige: 30 25% 90% - Card backgrounds, soft surfaces
- Success Green: 145 55% 55% - Percentile improvements
- Warning Amber: 35 75% 65% - Moderate alerts
- Neutral Gray: 220 10% 60% - Secondary text, borders

### B. Typography

**Font Families**
- Primary: 'DM Sans' (Google Fonts) - Clean, friendly, highly readable for health data
- Accent: 'Fredoka' (Google Fonts) - Playful headers for milestone celebrations

**Type Scale**
- Display (Milestone headers): Fredoka 32px/40px bold
- H1 (Section titles): DM Sans 24px/32px semibold
- H2 (Card headers): DM Sans 18px/24px semibold
- Body: DM Sans 16px/24px regular
- Caption (Percentiles, dates): DM Sans 14px/20px regular
- Small (Helper text): DM Sans 12px/16px medium

### C. Layout System

**Spacing Primitives**
Use Tailwind units: 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- Card padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Component gaps: gap-3 to gap-4
- Screen margins: px-4 (mobile), px-6 (tablet)

**Grid System**
- Mobile-first: Single column with max-width of 640px
- Cards: Full-width with rounded-2xl borders
- Multi-column grids: grid-cols-2 for metric cards, grid-cols-3 for teeth tracking

### D. Component Library

**Navigation & Headers**
- Bottom tab navigation with icons (Home, Growth, Milestones, Profile)
- Top app bar with child switcher dropdown and profile photo
- Floating action button for quick metric entry (+ icon)

**Cards & Surfaces**
- Milestone cards: Rounded-2xl, shadow-sm, colored left border (4px) indicating status
- Metric cards: White background, subtle shadow, icon + value + percentile label
- Alert cards: Soft pink background with rose border-l-4
- Achievement cards: Mint green background with success icon

**Data Visualization**
- Line charts for growth trends (Chart.js or Recharts via CDN)
- Percentile badges: Circular with border, showing rank (e.g., "3rd percentile")
- Progress rings: Circular progress for milestone completion by category
- Trend indicators: Arrows with +/- values for percentile changes

**Forms & Inputs**
- Rounded input fields: rounded-xl with soft borders
- Date pickers: Native mobile date input with calendar icon
- Numeric steppers for measurements (kg, cm)
- Toggle switches for binary options (premature birth indicator)
- Photo upload: Circular avatar placeholder with camera icon overlay

**Interactive Elements**
- Primary CTA: Rounded-full, gradient from lavender to mint
- Secondary buttons: Outline variant with blurred background when over images
- Icon buttons: 48px tap target, soft circular background
- Modal sheets: Bottom sheet style with rounded top corners (rounded-t-3xl)

**Status & Feedback**
- Toast notifications: Top of screen, auto-dismiss, color-coded by type
- Loading states: Skeleton screens with pulse animation
- Empty states: Illustration + encouraging message + action button
- Success animations: Subtle confetti for milestone achievements

### E. Animations

**Micro-interactions (Minimal)**
- Card tap: Scale 0.98 transform on active state
- Achievement unlock: Single gentle bounce on milestone card
- Percentile change: Fade-in for new trend indicator
- Page transitions: Slide left/right for navigation (100ms ease-out)

---

## Screen-Specific Guidelines

**Onboarding Flow**
- Full-screen cards with progress dots at top
- Large friendly icons for each step
- Bottom-aligned continue button (fixed position)
- Skip option for optional questions

**Dashboard/Home**
- Hero card: Child photo, name, age in months/days
- Achievement highlight banner (recent milestones)
- Color-coded milestone category grid (2 columns)
- Quick action tiles for growth entry

**Growth Tracking**
- Tab navigation: Weight, Height, Head Circumference
- Current value display: Large number with percentile badge
- Trend chart: Line graph with shaded percentile zones
- History list: Scrollable entries with edit capability
- Add measurement FAB (bottom-right)

**Milestone Details**
- Tab view: About | Help
- Status indicator at top (achieved/pending)
- Age range display with visual timeline
- AI recommendations card with Claude branding
- Amazon product carousel (horizontal scroll)

**Amazon Recommendations**
- Product cards: Image, title, price, rating stars
- "Buy now" button with Amazon orange accent
- Filtering by category (toys, books, tools)
- Save for later heart icon

---

## Images

**Hero Images**
- Location: Dashboard child profile card, onboarding success screen
- Style: Soft-focused parent-child moments, warm natural lighting
- Treatment: Rounded-2xl corners, subtle vignette overlay
- Fallback: Gradient placeholder with child initial

**Product Images**
- Location: Amazon recommendation cards
- Style: Clean product photography on white background
- Size: Square aspect ratio, 1:1

**Iconography**
- Use Lucide Icons via CDN (lucide.dev)
- Style: Rounded, friendly stroke width
- Size: 24px standard, 20px in tight spaces, 32px for feature icons

---

## Accessibility & Quality Standards

- Minimum touch target: 44x44px for all interactive elements
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Dark mode: Full support across all screens with consistent color mapping
- Loading states: Skeleton screens during data fetch
- Error states: Clear messaging with suggested actions
- Offline capability: Cache milestone data locally