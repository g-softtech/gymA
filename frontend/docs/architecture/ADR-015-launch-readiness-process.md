# ADR 015: Launch Readiness Process

## Status
Accepted

## Context
Transitioning from a development phase to a production (1.0) launch requires a shift in focus from architecture to operations. We need a formalized, decentralized checklist system to ensure no critical launch requirements (e.g., Error Monitoring, SEO Indexing, Support queues) are forgotten.

## Decision
1. **Decentralized Checklists**: Instead of a single monolithic markdown file, the launch process is divided into domains within `docs/launch/`.
   - `00-launch-checklist.md` (The master blocker list)
   - `01-production-checklist.md` (Infrastructure, DNS, CDNs)
   - `02-marketing-checklist.md` (SEO, Google Search Console, Social assets)
   - `03-operations-checklist.md` (Error monitoring, internal KPI dashboards)
   - `04-security-checklist.md` (Pen-testing, rate-limiting, backups)
   - `05-support-checklist.md` (Helpdesk, knowledge base)
   - `06-post-launch-plan.md` (Day 2 operations)
2. **Launch Blockers**: Certain operational items are elevated to "Launch Blockers". For CortexFit, these include:
   - Google Search Console configuration
   - Error Monitoring (e.g., Sentry, BetterStack)
   - Cookie Consent for GDPR compliance

## Consequences
- Launch readiness becomes a verifiable, cross-functional effort.
- Marketing and Operations have clear visibility into their outstanding tasks.
