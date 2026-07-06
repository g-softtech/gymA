# CortexFit Intelligence System Architecture

## Phase 10: Intelligence Governance & Production Finalization Layer

Phase 10 provides the **system governance boundary**, enabling CortexFit to govern, simulate, and evolve intelligence safely. It bridges the gap between running scientific experiments and securely locking in official production logic (GitHub Releases for AI Behavior).

### 1. Database Schema Layer
We introduced tables to lock in system versions and maintain the historical audit log of promotions and emergency interventions.

- **`IntelligenceVersionRegistry`**: Acts as the "kernel config". Tracks the global active `scoringVersion`, `policyVersion`, and `experimentId` (if promoted from one). Includes a `status` (ACTIVE, DEPRECATED, ROLLED_BACK).
- **`IntelligencePromotionLog`**: Tracks the history of when and why a variant became production truth (`experimentId`, `variantName`, `promotedBy`, `reason`).
- **`IntelligenceSafetyEvent`**: Audit trail for kill switches and emergency throttles (`tenantId`, `action: DISABLE | THROTTLE | ROLLBACK`, `reason`, `triggeredAt`).

### 2. Experiment Promotion & Governance System
The core backend layer handling the transition from "test" to "official system truth".

- `promoteVariantToProduction(experimentId, variant)`: Promotes a winning variant, locking it into the `IntelligenceVersionRegistry`.
- `rollbackToStableVersion()`: Reverts the active intelligence kernel to the last known stable state.
- `evaluateKillSwitch()`: Checks global or tenant-level kill switches to short-circuit AI generation and fallback to deterministic manual logic.

### 3. Full Audit + Explainability Layer
Connecting Phase 7.2 (Scoring), Phase 8 (Outcomes), and Phase 9 (Experiments) into a single, unified "Why did the system do this?" API.

- `app/api/superadmin/intelligence/audit/[actionLogId]/route.ts`: Merges the `scoringSnapshot`, `ExperimentAssignment`, and `IntelligenceVersionRegistry` state into a single cohesive payload explaining exactly *why* a decision was made.

### 4. Executive Intelligence Report Layer
A CEO-facing output layer that aggregates the impact of the entire AI system into a single cohesive report.

- `lib/intelligence/executiveReporter.ts`: Computes `generateMonthlyImpactReport()` merging MRR saved, conversion rate uplifts, and experiment ROI into a single structured report.
- `app/api/superadmin/intelligence/reports/route.ts`: Exposes the report payload for the UI.
