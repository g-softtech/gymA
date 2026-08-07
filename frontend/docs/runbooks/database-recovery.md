# Runbook: Database Recovery

**Incident:** Data loss, accidental mutation, or catastrophic database failure.

## 1. Assess the Damage
1. Identify if the issue is a platform-wide outage or isolated to a specific tenant.
2. Check the Neon Postgres dashboard to verify if the primary compute instance is active.

## 2. Recovery Objectives
- **RTO (Recovery Time Objective):** < 15 minutes for compute failure, < 1 hour for point-in-time recovery.
- **RPO (Recovery Point Objective):** < 5 minutes (based on WAL shipping to S3 via Neon).

## 3. Mitigation & Restoration
**Scenario A: Compute Instance Down**
- Neon automatically provisions a new compute instance if the primary fails. Wait 60 seconds and verify connection.

**Scenario B: Accidental Data Deletion (Point-in-Time Recovery - PITR)**
1. Log into the Neon Console.
2. Select the CortexFit production database branch.
3. Click "Restore from Backup" or use the Branching feature to create a historical branch (e.g., exactly 5 minutes before the incident).
4. If the branch data is verified as correct, promote the branch to production or manually copy the lost records via SQL (`INSERT INTO ... SELECT FROM ...`).

**Scenario C: Total Region Failure**
- If the entire AWS region hosting Neon fails, we must initialize the database in a fallback region using our daily logical `pg_dump` backups stored in separate S3 buckets, then update the `DATABASE_URL` in Vercel.
