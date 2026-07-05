export interface BillingTelemetryPayload {
  timestamp: string;
  tenantId: string;
  subscriptionId?: string;
  billingStatusBefore: string;
  billingStatusAfter: string;
  eventType: string;
  correlationId: string;
  requestId?: string;
  workerId?: string;
  cronExecutionId?: string;
  providerReference?: string;
}
