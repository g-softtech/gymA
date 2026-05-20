# 📌 MASTER PROMPT — SMART GYM SAAS PLATFORM (NEXT.JS + POSTGRESQL)

You are an expert **full-stack system architect, SaaS product designer, and database engineer**.

I want you to design and structure a complete **Smart Gym SaaS Platform from scratch** using:

* **Next.js (App Router)**
* **PostgreSQL (primary database)**
* **Prisma ORM (preferred)**
* Scalable SaaS architecture principles

This is a **production-level SaaS system**, not a demo.

---

# 🎯 CORE VISION

Build an **all-in-one Smart Gym Ecosystem** that combines:

* Gym management system
* Public marketing website
* Trainer booking platform
* Nutrition & meal planner
* Fitness community platform
* AI-powered fitness intelligence layer

The platform should function like:

> “A combination of Gymshark + MyFitnessPal + ClassPass + AI Personal Trainer + SaaS gym management system”

---

# 🧩 SYSTEM MODULES

## 1. PUBLIC WEBSITE (SEO + MARKETING LAYER)

Built with Next.js for SEO optimization.

### Features:

* Landing page
* About page
* Pricing & membership plans
* Trainers showcase
* Testimonials
* Blog system (SEO articles)
* Contact page
* Free trial signup
* Online registration
* Fully responsive UI

---

## 2. AUTHENTICATION & ROLE SYSTEM

### Roles:

* Admin (Gym owner)
* Trainer
* Member

### Features:

* Secure authentication (NextAuth or custom JWT)
* Role-based access control
* Email verification
* Password reset
* Session management

---

## 3. GYM MANAGEMENT SYSTEM (CORE SAAS ENGINE)

### Admin Features:

* Manage members
* Manage trainers
* Membership plans & subscriptions
* Attendance tracking
* Revenue tracking
* Reports & analytics
* Notifications system
* Multi-branch support (future-ready)

---

## 4. TRAINER MODULE

### Features:

* Trainer dashboard
* Client management
* Workout plan creation
* Schedule management
* Booking approvals
* Progress tracking per member
* Communication system

---

## 5. MEMBER DASHBOARD

### Features:

* Personal profile
* Membership status
* Workout plans
* Book trainer sessions
* View progress analytics
* Attendance history
* Notifications
* Access AI assistant

---

## 6. TRAINER BOOKING SYSTEM

### Features:

* Calendar-based scheduling
* Availability management
* Booking confirmation system
* Rescheduling & cancellation
* Conflict prevention logic
* Online/physical session support

---

## 7. NUTRITION & MEAL PLANNER SYSTEM

### Features:

* AI-generated meal plans
* Calorie tracking
* Macro breakdown (protein, carbs, fats)
* BMI calculator
* Food substitution system
* Local food adaptation (important for African/Nigerian meals)
* Diet goal tracking

---

## 8. FITNESS COMMUNITY PLATFORM

### Features:

* User posts (text/images)
* Likes & comments
* Fitness challenges
* Leaderboards
* Badges & achievements
* Social feed algorithm

---

# 🧠 9. SMART AI LAYER (CORE DIFFERENTIATOR)

This is the intelligence engine of the entire system.

## 9.1 AI FITNESS COACH

* Generates personalized workout plans
* Adjusts plans based on progress
* Recommends intensity and rest days
* Answers fitness questions

---

## 9.2 AI NUTRITION COACH

* Generates meal plans based on:

  * BMI
  * fitness goals
  * budget/local foods
* Provides calorie + macro breakdown
* Suggests substitutions

---

## 9.3 AI PROGRESS ANALYZER

* Tracks user fitness data:

  * weight changes
  * workout consistency
  * attendance
* Provides insights and predictions:

  * progress improvement %
  * missed workout alerts
  * trend forecasting

---

## 9.4 AI CHAT ASSISTANT (UNIFIED COACH)

A conversational AI inside the platform that can:

* Generate workouts
* Create meal plans
* Answer fitness questions
* Give motivation
* Explain exercises

---

## 9.5 AI BOOKING OPTIMIZER

* Suggest best trainer time slots
* Match users with ideal trainers
* Prevent scheduling conflicts

---

## 9.6 AI COMMUNITY ENGINE

* Suggest relevant posts
* Generate weekly challenges
* Recommend fitness groups

---

# 🗄️ DATABASE REQUIREMENTS (POSTGRESQL + PRISMA)

Design a fully relational database with:

## Core Tables:

* users
* roles
* trainers
* members_profiles
* memberships
* payments
* bookings
* workouts
* meal_plans
* attendance
* community_posts
* comments
* likes
* ai_logs
* notifications
* subscriptions

---

## Key Relationships:

* users ↔ roles (many-to-one)
* users ↔ memberships
* trainers ↔ bookings
* users ↔ workouts
* users ↔ meal_plans
* users ↔ community_posts
* ai_logs linked to users

---

## Requirements:

* Fully normalized schema
* ACID compliance for payments
* Efficient indexing for bookings and analytics
* Scalable structure for SaaS multi-tenancy

---

# ⚙️ API ARCHITECTURE (NEXT.JS)

Design REST or hybrid API structure:

## Core Endpoints:

* /api/auth/*
* /api/users/*
* /api/memberships/*
* /api/trainers/*
* /api/bookings/*
* /api/workouts/*
* /api/meals/*
* /api/payments/*
* /api/community/*
* /api/ai/*

---

# 🧠 AI INTEGRATION REQUIREMENTS

Recommend:

* OpenAI API or Google Gemini API
* Structured JSON responses for AI outputs
* Prompt engineering templates for:

  * workout generation
  * meal planning
  * fitness analysis
* AI service abstraction layer

---

# 🧱 FRONTEND ARCHITECTURE (NEXT.JS)

## Structure:

* /app (App Router)
* /components
* /modules
* /services
* /lib
* /hooks

## Dashboards:

* Admin dashboard
* Trainer dashboard
* Member dashboard

---

# 💳 PAYMENT SYSTEM

Support:

* Subscription plans
* One-time trainer booking payments

Integrate:

* Paystack (Nigeria)
* Flutterwave

Ensure:

* Payment verification
* Webhook handling
* Subscription lifecycle management

---

# 🔐 SECURITY REQUIREMENTS

* Role-based access control
* Protected routes
* Input validation
* Rate limiting
* Secure API handling
* Data encryption for sensitive fields

---

# 📊 REQUIRED OUTPUT FROM YOU (GEMINI)

Provide:

1. Full system architecture (detailed explanation)
2. Complete PostgreSQL + Prisma schema design
3. API route structure
4. Frontend component breakdown (Next.js App Router)
5. AI prompt templates for each smart feature
6. Folder/project structure (production-grade)
7. SaaS scalability plan (multi-tenant architecture)
8. Recommended development roadmap (phased build plan)

---

# 🚀 FINAL GOAL

Design a fully scalable **Smart Gym SaaS Platform** with:

* AI-powered fitness coaching
* Nutrition intelligence
* Booking system
* Community engagement
* Real gym management tools

It must be:

> Production-ready, scalable, and suitable for real-world gym businesses.

