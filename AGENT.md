To help you move forward immediately, here is the complete, raw content for your AGENT.md file. You can copy this entire block and paste it into a file named AGENT.md in your project's root directory.📌 AGENT.md — MASTER PRODUCTION COMPASSSMART GYM SAAS PLATFORM (NEXT.JS 15 + POSTGRESQL + PRISMA)1. SYSTEM ARCHITECTURE & SCALEThis platform is engineered as a Multi-Tenant SaaS ecosystem using a Shared-Database, Isolated-Row-Level architecture. It leverages Next.js 15 for high-performance marketing and dynamic user interactions.  Multi-Tenancy: Gyms are routed via subdomains or custom domains. Every transactional table contains a tenant_id column to ensure strict data isolation.  Infrastructure: Uses Vercel for compute, PostgreSQL for data, and Redis for caching and rate-limiting.  2. CORE DATABASE SCHEMA (PRISMA)This schema handles users, modular roles, financial tracking, and AI-logged entities.  Code snippetdatasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPERADMIN
  ADMIN       // Gym Owner
  TRAINER     // Gym Employee
  MEMBER      // Customer
}

model Tenant {
  id              String           @id @default(cuid())
  name            String
  slug            String           @unique
  users           User[]
  membershipPlans MembershipPlan[]
}

model User {
  id             String          @id @default(cuid())
  tenantId       String
  tenant         Tenant          @relation(fields: [tenantId], references: [id])
  email          String          @unique
  role           Role            @default(MEMBER)
  memberProfile  MemberProfile?
  trainerProfile TrainerProfile?
}

model MemberProfile {
  id             String         @id @default(cuid())
  userId         String         @unique
  weightKg       Float?
  heightCm       Float?
  fitnessGoals   String[]
  subscriptions  Subscription[]
  workouts       WorkoutPlan[]
  mealPlans      MealPlan[]
}

model TrainerProfile {
  id             String         @id @default(cuid())
  userId         String         @unique
  specialties    String[]
  availability   Json           // Weekly slots
}

model MembershipPlan {
  id            String         @id @default(cuid())
  tenantId      String
  name          String
  price         Float
  durationDays  Int
}

model WorkoutPlan {
  id             String         @id @default(cuid())
  memberId       String
  member         MemberProfile  @relation(fields: [memberId], references: [id])
  routines       Json           
  isAiGenerated  Boolean        @default(false)
}
3. PROJECT FOLDER STRUCTUREThe project is organized to separate marketing, authentication, and core dashboard logic.  Plaintext/src
  /app
    /(marketing)        # Landing, Pricing, Blog (SEO layer)
    /(auth)             # NextAuth sign-in/up
    /dashboard          # Core Application Shell
      /admin            # Owner metrics
      /trainer          # Client schedules
      /member           # Workouts & AI Coach
    /api/v1             # AI, Bookings, Community endpoints
  /components
    /ui                 # Shadcn elements
    /forms              # Validated submissions
  /lib
    /prisma.ts          # Database initialization
    /ai-service.ts      # LLM gateway abstraction
4. KEY FEATURE IMPLEMENTATIONSPayments: Automated webhook handlers for Paystack/Flutterwave to verify transactions and activate memberships.  Booking Engine: Logic to prevent trainer schedule collisions by checking for chronological overlaps.  AI Coach: A conversational panel for members to request personalized workouts and localized meal adjustments.  5. AI PROMPT ENGINEERINGThe system uses strict JSON output definitions for AI features:  Workout Coach: Acts as a biomechanics specialist to generate hypertrophy splits.  Nutrition Coach: Acts as a dietitian using hyper-local African ingredients.  6. DEVELOPMENT ROADMAPPhase 1: Core Multi-tenant Auth and Tenant-switching.  Phase 2: Membership plans and Payment gateway integration.  Phase 3: Booking calendar and manual Workout/Meal tools.  Phase 4: Full AI integration for automated plan generation.  Phase 5: Social community and SEO optimization.  



# CONTINUATION RULES

This is NOT a new project.

Before making any changes:

1. Read ROADMAP.md
2. Read REQUIREMENT.md
3. Audit the current codebase
4. Identify the current active phase
5. Continue implementation from the current state

Do NOT:
- Rebuild completed systems
- Regenerate architecture
- Rewrite working features
- Restart the project

Always determine:

- What is complete
- What is partially complete
- What is missing for the current phase

Then continue only with the current phase.

Current Priority:

PHASE 9A - Gym Owner SaaS Onboarding

The backend tenant provisioning system already exists.

Examples:
- Tenant model
- TenantSettings
- /api/tenant/create
- Admin role assignment
- Dynamic gym routing

The missing piece is the frontend onboarding flow.

Required deliverables:

- Create Gym page
- Gym creation wizard
- Slug generation
- Slug validation
- Connect to /api/tenant/create
- Admin onboarding
- Redirect to admin dashboard

Before coding:

Provide:
1. Current phase detected
2. Existing implementation
3. Missing implementation
4. Files to be modified
5. Execution plan

After completing work:

- Update ROADMAP.md
- Update implementation logs
- Mark completed tasks