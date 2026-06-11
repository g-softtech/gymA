# CORTEXFIT - MASTER PROJECT VISION & ROADMAP

## PURPOSE OF THIS FILE

This document is the permanent source of truth for the CortexFit project.

Before making architectural decisions, adding features, refactoring code, or starting new work, every coding agent must read this file and align all work with it.

If implementation decisions conflict with this document, this document takes priority.

---

# PROJECT NAME

CortexFit

---

# PRODUCT VISION

CortexFit is a production-grade AI-powered Gym Management SaaS Platform.

The goal is to become the operating system for fitness businesses.

CortexFit combines:

* Gym Management System
* Membership Management
* Trainer Management
* Attendance Tracking
* Trainer Booking Platform
* AI Fitness Coaching
* AI Nutrition Coaching
* AI Progress Analytics
* Fitness Community Platform
* SaaS Website Builder
* Multi-Tenant Gym Platform

The long-term vision is:

"A combination of Gymshark + MyFitnessPal + ClassPass + AI Personal Trainer + SaaS Gym Management Platform."

---

# CURRENT PROJECT STATUS

The platform is NOT an MVP anymore.

The following systems are already implemented:

## SaaS Foundation

* Multi-tenant architecture
* Tenant isolation
* Tenant settings
* Gym-specific routing
* Dynamic gym pages
* Tenant provisioning API
* Superadmin role
* Admin role
* Trainer role
* Member role

## Authentication

* Google OAuth
* Credentials login
* NextAuth
* Role-based access control

## Public Marketing Website

* Landing page
* Pricing page
* About page
* Contact page
* Blog system

## Gym Public Website

* Dynamic gym pages
* Membership plans
* Trainer showcase
* Contact forms

## Payments

* Paystack integration
* Membership purchases
* Webhook processing
* Subscription records

## Member Dashboard

* Profile management
* Membership status
* AI Hub
* Nutrition hub
* Workout hub

## Trainer Dashboard

* Client management
* Workout assignment
* Schedule management

## Admin Dashboard

* Revenue management
* Member management
* Trainer management
* Website builder
* Blog management
* AI usage tracking

## AI Layer

Google Gemini Integration

Implemented:

* AI Fitness Coach
* AI Nutrition Coach
* AI Progress Analyzer
* AI Chat Assistant

---

# CRITICAL DISCOVERY

The backend SaaS architecture exists.

The frontend SaaS onboarding flow DOES NOT exist.

Currently:

Users can sign up as members and purchase plans.

Users CANNOT create a gym and become a gym owner through the UI.

This is currently the biggest gap in the platform.

---

# CURRENT DEVELOPMENT PHASE

PHASE 9A

Gym Owner SaaS Onboarding

This phase must be completed before moving to any other major feature.

---

# PHASE 9A - GYM OWNER ONBOARDING

Goal:

Allow gym owners to create and launch their own gym without developer intervention.

Required Deliverables:

* Create Gym page
* Multi-step onboarding wizard
* Gym name input
* Automatic slug generation
* Slug availability checking
* Connect frontend to /api/tenant/create
* Automatic ADMIN assignment
* TenantSettings initialization
* Success screen
* Redirect to admin dashboard

Required Flow:

Landing Page
→ Start Free Trial
→ Sign Up
→ Create Gym
→ Select Plan
→ Create Tenant
→ Admin Dashboard

Marketing buttons must point to this onboarding flow.

Success Result:

A brand-new user can create a gym without touching the database.

---

# PHASE 9B - SAAS BILLING

Goal:

Gym owners pay CortexFit for software usage.

Required Deliverables:

* SaaS pricing plans
* Starter plan
* Growth plan
* Pro plan
* Enterprise plan
* Tenant billing portal
* Subscription upgrades
* Subscription downgrades
* Feature gating
* Trial periods

Result:

CortexFit becomes monetizable.

---

# PHASE 10 - CUSTOM DOMAINS

Goal:

Allow gyms to use their own domain names.

Examples:

powergym.com
fitnation.com
elitefitness.ng

Instead of:

cortexfit.com/gym/powergym

Required Deliverables:

* Domain verification
* DNS validation
* Vercel domain integration
* SSL handling
* Domain dashboard

---

# PHASE 11 - AI BOOKING OPTIMIZER

Goal:

Use AI to improve trainer scheduling.

Required Deliverables:

* Smart trainer matching
* Schedule recommendations
* Conflict prevention
* Trainer recommendations
* Availability intelligence

---

# PHASE 12 - AI COMMUNITY ENGINE

Goal:

Increase engagement and retention.

Required Deliverables:

* Feed recommendations
* AI-generated challenges
* Group recommendations
* Smart badges
* Community insights

---

# PHASE 13 - FLUTTERWAVE

Goal:

Add secondary African payment gateway.

Required Deliverables:

* Flutterwave integration
* Webhooks
* Subscription support

---

# DEVELOPMENT RULES

Before building any feature:

1. Check this roadmap.
2. Identify current phase.
3. Finish current phase before starting another.
4. Do not introduce major new systems outside the roadmap.
5. Update this document after each completed phase.

---

# DEFINITION OF SUCCESS

CortexFit becomes a self-serve AI-powered Gym SaaS platform where:

* Gym owners can create gyms
* Members can subscribe
* Trainers can manage clients
* AI provides fitness intelligence
* Gyms can operate independently
* Gym owners pay CortexFit monthly
* Custom domains are supported
* Platform scales to thousands of gyms
