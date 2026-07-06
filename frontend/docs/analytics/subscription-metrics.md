# Subscription Analytics Metrics

This document formalizes the definitions and mathematical calculations for all metrics surfaced in the Subscription Analytics domain. It exists to prevent future developers from "fixing" calculations and unintentionally altering historical business meaning.

All metrics are aggregated strictly from Canonical Domain Entities (`Subscription` and `Transaction`), never from operational `AuditLog` history.

---

## 1. Renewal Rate

Measures the percentage of subscriptions eligible for renewal that were successfully renewed during the reporting period.

- **Formula**: `(Successfully Renewed Subscriptions / Eligible Subscriptions) * 100`
- **Numerator**: The count of subscriptions whose `endDate` fell within the period and have a status of `ACTIVE`.
- **Denominator**: The total count of subscriptions whose *previous or current* `endDate` fell within the period (both `EXPIRED` and those successfully renewed to `ACTIVE`).
- **Reporting Period**: Period boundary (e.g., month of July).
- **Exclusions**: Subscriptions cancelled *before* their natural expiry.

---

## 2. Retention Rate

Measures how well the gym retains its active user base over a specific period, adjusting for new acquisitions.

- **Formula**: `((Active at End of Period - New Subscriptions Acquired During Period) / Active at Start of Period) * 100`
- **Numerator**: Current Active Subscriptions on the final day minus the count of Subscriptions that started (first activation) within the period.
- **Denominator**: Active Subscriptions on the very first day of the period.
- **Reporting Period**: Typically calculated monthly.
- **Exclusions**: Memberships on Trial status.

---

## 3. Recovery Rate

Measures the effectiveness of dunning, retries, and manual intervention at rescuing failed payments.

- **Formula**: `(Recovered Failures / Total Initial Failures) * 100`
- **Numerator**: The count of failed `Transaction`s that have a corresponding subsequent `SUCCESS` transaction for the same subscription/billing cycle within the recovery window.
- **Denominator**: Total count of unique failed billing attempts initiated within the reporting period.
- **Reporting Period**: Driven by the `recoveryWindowDays` (default: 14 days).
- **Exclusions**: Admin-waived fees or manual overrides that do not collect actual revenue.

---

## 4. Expiring Trends

Provides a forward-looking or historical aggregate of subscription expirations grouped by specific time buckets to assist in resource planning and marketing blasts.

- **Calculation**: Count of subscriptions whose `endDate` falls inside each bucket.
- **Buckets**: Supported granularities are `day`, `week`, and `month`.
- **Exclusions**: Subscriptions already permanently cancelled.

---

## 5. Average Subscription Lifetime (Continuous Duration)

Measures the average continuous membership duration across all members, providing a proxy for customer loyalty.

- **Calculation**: The average difference (in months) between a subscription's initial `startDate` and its `endDate`.
- **Definition of "Lifetime"**: Because members can churn and return, we define Lifetime as the **Continuous Membership Duration** for a single subscription object. 
- **Exclusions**: Active subscriptions are included using `Clock.now()` as the interim `endDate`.

---

## 6. Upcoming Revenue at Risk

Estimates the monetary value of active subscriptions that are approaching their expiration date.

- **Calculation**: Sum of the expected MRR (based on Plan pricing) for all `ACTIVE` subscriptions whose `endDate` is strictly within the next 30 days from `Clock.now()`.
- **Exclusions**: `CANCELLED`, `EXPIRED`, and `PENDING_PAYMENT` statuses. Annual plans are included if their expiry falls within the window.

---

## 7. Subscription Distribution

Provides a snapshot of active membership distribution across available Pricing Plans.

- **Calculation**: Count of `ACTIVE` subscriptions grouped by `planId`.
- **Exclusions**: Expired, cancelled, or trial members.
