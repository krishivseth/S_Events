# Guest Chemistry - AI-Powered Event Guest Curation

A modern React application that helps event organizers curate the perfect guest list using AI-powered chemistry analysis and availability optimization.

![Guest Chemistry](https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop)

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo Walkthrough](#live-demo-walkthrough)
3. [Features](#features)
4. [User Interface Guide](#user-interface-guide)
5. [How It Works](#how-it-works)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Data Models](#data-models)
9. [Core Algorithms](#core-algorithms)
10. [Design System](#design-system)
11. [Routes](#routes)
12. [Getting Started](#getting-started)
13. [Future Enhancements](#future-enhancements)

---

## Overview

Guest Chemistry is a sophisticated event planning tool that goes beyond simple RSVPs. It analyzes guest compatibility based on shared connections, schools, age groups, and professional backgrounds. The app visualizes social connections through an interactive force-directed graph and automatically finds the best meeting times for your group.

**The Problem**: Traditional event planning tools focus on logistics but ignore the social dynamics that make events successful. Who should sit next to whom? Will this group have good conversation flow? When is everyone actually free?

**The Solution**: Guest Chemistry uses AI-powered algorithms to score guest compatibility, visualize social networks, and optimize both the guest list composition and timing.

---

## Live Demo Walkthrough

### Step 1: Landing Page (`/`)
The landing page introduces the app with a hero section featuring:
- A headline highlighting the AI-powered curation capability
- Feature cards showcasing Chemistry Analysis, Auto-Scheduling, and Smart Invites
- Clear call-to-action buttons to create events or browse existing ones

### Step 2: Create an Event (`/create-event`)
Users fill out a form with:
- **Cover Image**: Optional visual branding for the event
- **Title**: e.g., "Founder Dinner - Series A Celebration"
- **Description**: Details about the event purpose and what guests should expect
- **Date & Time**: When the event will take place
- **Privacy Settings**: Toggle between private (invite-only) and public
- **Max Attendees**: Limit the guest count (e.g., 10 for intimate dinners)

### Step 3: Curate Your Guest List (`/guest-builder`)
This is the core experience—a split-panel interface:

**Left Panel (Guest Selection)**:
- Search bar to find guests by name, school, role, or company
- Filter badges to narrow by university (Stanford, MIT, Harvard, etc.)
- Grid of guest cards showing:
  - Profile photo with "already know" indicator
  - Name and role
  - Chemistry score (color-coded percentage)
  - Connection degree (1st, 2nd, 3rd)
  - Add/Remove button

**Right Panel (Analysis)**:
- **Chemistry Tab**:
  - Large chemistry score display (0-100%)
  - Interactive force-directed graph showing guest connections
  - Nodes sized by individual chemistry scores
  - Connection lines weighted by pairwise compatibility
  - Insights panel with positive signals and warnings
  
- **Availability Tab**:
  - 7-day × 13-hour heatmap grid
  - Color intensity shows number of guests available
  - "Best Times" suggestions with availability counts
  - Auto-scheduling integration

**Action Buttons**:
- `Auto-Curate Event`: AI selects optimal guests + finds best time
- `Optimize List`: Removes low-chemistry guests
- `Send Invites`: Opens personalized invitation modal

### Step 4: View Your Events (`/events`)
Dashboard with two tabs:
- **Hosting**: Events you're organizing with attendee counts and dates
- **Invited**: Events you've been invited to with RSVP status

### Step 5: Event Details (`/events/:eventId`)
Full event page featuring:
- Cover image hero section
- Date card overlay
- Host information with avatar
- Location with address
- Full description
- Guest list with RSVP statuses (Going, Maybe, Invited)
- Bottom action bar (Copy Link, Message Guests for hosts; RSVP for guests)

---

## Features

### 🎯 Smart Guest Curation

| Feature | Description |
|---------|-------------|
| **Chemistry Analysis** | AI-powered compatibility scoring between all guest pairs based on shared schools, age proximity, mutual connections, and professional overlap |
| **Auto-Curation** | One-click guest list optimization that selects the best group composition and removes low-chemistry attendees |
| **Visual Chemistry Graph** | Interactive force-directed graph where node size represents individual chemistry and link thickness shows pairwise compatibility |
| **Connection Indicators** | Clear badges showing 1st, 2nd, or 3rd degree connections, plus "already know" markers |

### 📅 Availability Optimization

| Feature | Description |
|---------|-------------|
| **Group Availability Heatmap** | 7-day × 13-hour grid showing collective availability with color-coded intensity |
| **Best Time Suggestions** | Automatically identifies the top 3 time slots where most guests are free |
| **Auto-Scheduling** | Combines guest optimization with time selection in one action |
| **Pre-set User Availability** | Remembers your typical availability patterns (e.g., college student evening schedule) |

### 🎉 Event Management

| Feature | Description |
|---------|-------------|
| **Event Creation** | Form-based creation with cover images, descriptions, and settings |
| **Guest Management** | Add, remove, and manage guests with real-time chemistry updates |
| **RSVP Tracking** | Track responses as Going, Maybe, or Pending |
| **Personalized Invites** | AI-assisted invitation messages with placeholders for guest-specific details |
| **Edit Mode** | Modify guest lists for existing events |

---

## User Interface Guide

### Navigation Bar
- **Logo**: "Guest Chemistry" brand link to home
- **Create Event**: Primary action button
- **Events**: Link to dashboard
- **Privacy**: Link to privacy policy

### Guest Card Component
```
┌─────────────────────────┐
│     [Profile Photo]     │  ← Circular avatar, 56px
│     👥 (if connected)   │  ← "Already know" indicator
│                         │
│      Sarah Chen         │  ← Name (truncated if long)
│    Venture Partner      │  ← Role
│                         │
│   87%  [2nd]           │  ← Chemistry score + connection degree
│                         │
│  ┌─────────────────┐   │
│  │    + Add        │   │  ← Toggle button
│  └─────────────────┘   │
└─────────────────────────┘
```

### Chemistry Score Display
- **90-100%**: Green glow, "Excellent chemistry!"
- **70-89%**: Yellow/amber, "Good potential"
- **Below 70%**: Red tint, "May need attention"

### Availability Heatmap
```
         Mon  Tue  Wed  Thu  Fri  Sat  Sun
  9am    [░]  [░]  [░]  [░]  [░]  [▓]  [▓]
 10am    [░]  [░]  [░]  [░]  [░]  [▓]  [▓]
 11am    [░]  [░]  [░]  [░]  [░]  [▓]  [▓]
  ...
  7pm    [▓]  [▓]  [▓]  [▓]  [▓]  [▓]  [░]
  8pm    [▓]  [▓]  [▓]  [▓]  [▓]  [▓]  [░]
  
Legend: [░] = Few available  [▒] = Half  [▓] = Most/All
```

---

## How It Works

### Chemistry Calculation Algorithm

The chemistry score is calculated through multiple factors:

```
Base Score: 60 points

Bonuses:
├── Same School:           +15 points
├── Similar Age (±5 yrs):  +10 points
├── Same Gender:            +5 points
├── Already Know Each Other: +10 points
├── 1st Degree Connection:  +8 points
├── 2nd Degree Connection:  +4 points
├── Same Role/Industry:     +5 points
└── Random Variance:        ±5 points

Final Range: 45-98%
```

### Group Chemistry Calculation

1. Calculate pairwise scores for all guest combinations
2. Average all pairwise scores to get base group score
3. Apply bonuses for:
   - Number of 1st degree connections
   - Number of guests who already know each other
4. Cap final score at 98%

### Optimization Algorithm

When "Optimize List" is clicked:
1. Identify guests with 3rd degree connections
2. If group has 5+ guests and includes 3rd degree connections who don't know anyone
3. Remove up to 2 lowest-chemistry 3rd degree connections
4. Recalculate group chemistry

### Availability Matching

1. Generate mock availability for each guest using seeded random function
2. Include user's pre-set availability (evenings + weekends)
3. Sum available guests per time slot
4. Rank slots by total availability
5. Surface top 3 as "Best Times"

---

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React 18 | UI component library |
| **Build Tool** | Vite | Fast development & bundling |
| **Language** | TypeScript | Type-safe JavaScript |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Radix primitives + Tailwind |
| **Animations** | Framer Motion | Smooth transitions & micro-interactions |
| **Routing** | React Router DOM | Client-side navigation |
| **Data Fetching** | TanStack React Query | Async state management |
| **Graph Visualization** | react-force-graph-2d | Interactive network diagrams |
| **Charts** | Recharts | Data visualization |
| **Forms** | React Hook Form + Zod | Form handling + validation |
| **Toasts** | Sonner | Notification system |

---

## Project Structure

```
src/
├── components/                    # Reusable UI components
│   ├── ui/                       # shadcn/ui base components (40+ components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── AvailabilityHeatmap.tsx   # 7×13 grid showing group availability
│   ├── ChemistryGraph.tsx        # Force-directed network visualization
│   ├── ChemistryScore.tsx        # Animated percentage display
│   ├── CoverImagePicker.tsx      # Image upload/selection component
│   ├── GuestCard.tsx             # Individual guest card with actions
│   ├── InsightsPanel.tsx         # Chemistry insights + warnings
│   ├── Navbar.tsx                # Top navigation bar
│   ├── ProfileCard.tsx           # Compact profile display
│   ├── ProfileView.tsx           # Full profile modal
│   └── PrivacyDashboard.tsx      # Privacy settings interface
│
├── pages/                         # Route page components
│   ├── Index.tsx                 # Landing page with hero section
│   ├── CreateEvent.tsx           # Event creation form
│   ├── EventDashboard.tsx        # Events list (hosting/invited tabs)
│   ├── EventDetail.tsx           # Single event view with guest list
│   ├── EditEvent.tsx             # Event editing interface
│   ├── GuestListBuilder.tsx      # Main curation interface (core feature)
│   ├── Privacy.tsx               # Privacy policy page
│   └── NotFound.tsx              # 404 error page
│
├── services/                      # Business logic
│   └── chemistryCalculator.ts    # Chemistry scoring algorithms
│       ├── calculateGroupChemistry()
│       ├── optimizeGuestList()
│       └── getIndividualChemistry()
│
├── data/                          # Mock data for demo
│   └── mockEventData.ts          # 20 sample profiles + events
│       ├── mockProfiles[]        # CommunicationProfile objects
│       ├── mockEvents[]          # Event objects
│       └── pairwiseChemistryMap  # Pre-calculated scores
│
├── types/                         # TypeScript definitions
│   └── event.ts
│       ├── Event
│       ├── Guest
│       ├── CommunicationProfile
│       ├── ChemistryAnalysis
│       ├── GraphNode
│       └── GraphLink
│
├── hooks/                         # Custom React hooks
│   ├── use-mobile.tsx            # Mobile viewport detection
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                           # Utility functions
│   └── utils.ts                  # cn() helper for classnames
│
├── App.tsx                        # Main app with route definitions
├── main.tsx                       # React DOM entry point
└── index.css                      # Global styles + design tokens
```

---

## Data Models

### CommunicationProfile
```typescript
interface CommunicationProfile {
  userId: string;           // Unique identifier (e.g., "user-1")
  name: string;             // Display name (e.g., "Sarah Chen")
  avatar: string;           // Profile image URL
  age: number;              // Age in years (21-35 in demo)
  gender: 'male' | 'female' | 'other';
  school: string;           // University (e.g., "Stanford University")
  role: string;             // Job title (e.g., "Founder & CEO")
  company: string;          // Company name (e.g., "a16z")
  bio: string;              // Short description (50-100 chars)
  connectionDegree: 1 | 2 | 3;  // Network distance
  alreadyKnow: boolean;     // Pre-existing relationship
  linkedinUrl?: string;     // Optional LinkedIn profile
}
```

### ChemistryAnalysis
```typescript
interface ChemistryAnalysis {
  groupScore: number;       // 0-100 percentage
  insights: string[];       // Positive observations (max 4)
  warnings: string[];       // Potential issues
  pairwiseScores: Record<string, number>;  // "user-1_user-2": 85
}
```

### Event
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  host: string;             // userId of host
  type: 'private' | 'public';
  maxAttendees: number;
  guests: Guest[];
  chemistryScore: number;
}
```

---

## Core Algorithms

### ChemistryGraph Component

The force-directed graph uses `react-force-graph-2d` with:

```typescript
// Node configuration
nodeRelSize: 4,              // Base node size
nodeVal: (node) => chemistry * 0.4,  // Scale by chemistry score

// Link configuration  
linkWidth: (link) => strength / 30,  // Thicker = stronger chemistry
linkColor: (link) => getColorByStrength(link.strength),

// Physics
d3AlphaDecay: 0.04,         // Simulation cooling rate
d3VelocityDecay: 0.15,      // Node movement friction
warmupTicks: 100,           // Initial physics iterations
```

### Availability Heatmap

```typescript
// Time configuration
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['9am', '10am', ... '9pm'];  // 13 slots

// User's pre-set availability (college student schedule)
const USER_AVAILABILITY = {
  Mon: [false, false, false, false, false, false, true, true, ...],  // Free after 3pm
  Sat: [true, true, true, true, true, true, true, true, ...],        // All day
  // ...
};

// Heat color calculation
getHeatColor(availableCount, totalPeople) {
  const percentage = count / total;
  if (percentage >= 0.9) return 'bg-green-500';    // Most available
  if (percentage >= 0.7) return 'bg-green-400';
  if (percentage >= 0.5) return 'bg-yellow-400';
  if (percentage >= 0.3) return 'bg-orange-400';
  return 'bg-orange-300';                          // Few available
}
```

---

## Design System

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | White (#fff) | Near-black (#080808) | Page background |
| `--foreground` | Black (#0d0d0d) | White (#fafafa) | Text color |
| `--primary` | Black | White | Buttons, emphasis |
| `--secondary` | Light gray (#f5f5f5) | Dark gray (#1f1f1f) | Card backgrounds |
| `--accent` | Blue (#0080ff) | Blue (#0080ff) | Links, highlights |
| `--chemistry-high` | Green (#16a34a) | Green (#22c55e) | Good scores |
| `--chemistry-medium` | Amber (#f59e0b) | Amber (#fbbf24) | Moderate scores |
| `--chemistry-low` | Red (#ef4444) | Red (#f87171) | Low scores |

### Typography

| Font | Class | Usage |
|------|-------|-------|
| Inter | `font-sans` | UI text, buttons, labels |
| Instrument Serif | `font-serif` | Headlines, hero text |

### Spacing Scale

Follows Tailwind's default spacing: `0.25rem` increments (4, 8, 12, 16, 20, 24, 32, 40, 48...)

### Border Radius

Uses rounded corners throughout:
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-full` (pill-shaped)
- Avatars: `rounded-full`
- Inputs: `rounded-xl` (12px)

### Custom Utilities

```css
.glass          /* Frosted glass card effect */
.glow-primary   /* Subtle shadow on primary buttons */
.glow-chemistry-high/medium/low  /* Colored glows for scores */
.animate-pulse-glow    /* Pulsing CTA button animation */
.animate-score-up      /* Score reveal bounce animation */
```

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index.tsx` | Landing page with hero and features |
| `/create-event` | `CreateEvent.tsx` | Event creation form |
| `/guest-builder` | `GuestListBuilder.tsx` | Guest curation interface |
| `/guest-builder?eventId=X` | `GuestListBuilder.tsx` | Edit guests for existing event |
| `/events` | `EventDashboard.tsx` | Event dashboard with tabs |
| `/events/:eventId` | `EventDetail.tsx` | Single event details |
| `/events/:eventId/edit` | `EditEvent.tsx` | Edit event details |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `*` | `NotFound.tsx` | 404 page |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd guest-chemistry

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

### Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Future Enhancements

### Backend Integration
- [ ] Supabase database for persistent storage
- [ ] Real authentication (email, OAuth)
- [ ] Real-time guest list updates

### Expanded Features
- [ ] Email invitation sending
- [ ] Google Calendar integration
- [ ] Outlook calendar integration
- [ ] SMS notifications
- [ ] Guest profile verification

### AI Enhancements
- [ ] Natural language event descriptions
- [ ] AI-generated personalized invitations
- [ ] Conversation topic suggestions
- [ ] Seating arrangement optimization

### Mobile Experience
- [ ] Progressive Web App (PWA)
- [ ] Native mobile app (React Native)
- [ ] Push notifications

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is built with [Lovable](https://lovable.dev).

---

## Contact

For questions or feedback, reach out through the Lovable platform or open an issue on GitHub.
