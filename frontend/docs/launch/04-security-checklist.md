# Security Checklist

## Application Security
- [ ] Role-based access control (RBAC) verified across all routes (`middleware.ts`).
- [ ] Rate limiting active for public endpoints (Auth, Magic Links).
- [ ] PII excluded from analytics payloads (`trackEvent`).

## Infrastructure Security
- [ ] Database connection strings secure (no public IP access, connection pooling).
- [ ] CORS policies properly restricted.
- [ ] Vercel protection bypass secrets disabled or rotated.

## Compliance
- [ ] Cookie consent manager implemented (GDPR/UK).
- [ ] Data deletion process (right to be forgotten) documented.
