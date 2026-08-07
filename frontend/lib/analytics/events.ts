/**
 * A central registry of standard analytics events.
 * Using a constant object ensures consistency and prevents typos across the platform.
 */
export const ANALYTICS_EVENTS = {
  // Marketing & Top-of-Funnel
  LANDING_PAGE_VIEWED: "landing_page_viewed",
  PRICING_VIEWED: "pricing_viewed",
  FEATURES_VIEWED: "features_viewed",
  DEMO_STARTED: "demo_started",
  CONTACT_CLICKED: "contact_clicked",
  WHATSAPP_CLICKED: "whatsapp_clicked",

  // Acquisition & Onboarding
  START_FREE_TRIAL: "start_free_trial",
  SIGNUP_INITIATED: "signup_initiated",
  MAGIC_LINK_SENT: "magic_link_sent",
  MAGIC_LINK_USED: "magic_link_used",
  SIGNUP_COMPLETED: "signup_completed",
  GYM_CREATED: "gym_created",

  // Product Usage
  FIRST_MEMBER_ADDED: "first_member_added",
  CSV_IMPORT_STARTED: "csv_import_started",
  CSV_IMPORT_COMPLETED: "csv_import_completed",
  FIRST_PAYMENT_RECEIVED: "first_payment_received",
  FIRST_TRAINER_ADDED: "first_trainer_added",
  FIRST_CLASS_CREATED: "first_class_created",
  QR_CHECKIN_USED: "qr_checkin_used",

  // Billing
  PLAN_SELECTED: "plan_selected",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_SUCCESSFUL: "payment_successful",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Feature Adoption
  AI_ASSISTANT_USED: "ai_assistant_used",
  ATTENDANCE_CHECKIN: "attendance_checkin",
  PAYROLL_GENERATED: "payroll_generated",
  REPORT_EXPORTED: "report_exported",
  WEBSITE_PUBLISHED: "website_published",
  CUSTOM_DOMAIN_CONNECTED: "custom_domain_connected",
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
