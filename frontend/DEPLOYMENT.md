# Platform Deployment & Bootstrap Guide

This document outlines the strict procedure for initializing the Platform SuperAdmin infrastructure for CortexFit.

## 1. Concept: Platform-Scoped SuperAdmin
The CortexFit system utilizes a platform-scoped SuperAdmin (Option B). This user has global oversight but exists strictly **outside** of any individual Gym/Tenant (`tenantId = null`). This ensures pure multi-tenant isolation.

## 2. Bootstrapping
**CRITICAL**: The bootstrap script (`prisma/bootstrap-system.ts`) must **NEVER** run automatically in CI/CD pipelines or as part of a production startup routine. It must be executed manually or triggered via an explicitly controlled deployment step by a human operator.

### Required Environment Variables
Before running the script, the environment running it must contain:
- `PLATFORM_SUPERADMIN_EMAIL`: (e.g. `superadmin@cortexfit.com`)
- `PLATFORM_SUPERADMIN_PASSWORD`: A secure password of at least 8 characters.

*Note: These variables are intentionally **not** required for the application to run normally. They are only required by the bootstrap script.*

### Execution
Run the following command directly on your deployment host, or via a secure Vercel CLI invocation:
```bash
npx tsx prisma/bootstrap-system.ts
```

### Safety & Idempotency
- **Fail-Safe**: If the variables are missing, or the password is too weak (<8 chars), the script halts instantly without modifying the database or leaking secrets.
- **Zero State Drift**: The script uses a deterministic `upsert`. Running it twice yields the exact same database state. It will never create duplicate `superadmin@cortexfit.com` rows.
- **Role Escalation Audit**: If the script is run on an existing user to upgrade their privileges, it will generate a critical `BOOTSTRAP_ROLE_ESCALATED` audit log.
- **Secure Hashing**: Passwords are never stored in plaintext. They are strictly hashed using `bcrypt` (generating a secure `$2a$` hash prefix).

## 3. Account Management
To rotate the SuperAdmin password:
1. Update `PLATFORM_SUPERADMIN_PASSWORD` in your secure environment variables vault.
2. Re-run `npx tsx prisma/bootstrap-system.ts`.
3. The script will securely hash the new password and apply it idempotently.
