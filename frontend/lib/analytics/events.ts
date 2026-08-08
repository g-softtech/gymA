/**
 * A central registry of standard analytics events.
 * Using a constant object ensures consistency and prevents typos across the platform.
 */
export const ANALYTICS_EVENTS = {
  // Awareness
  LANDING_PAGE_VIEWED: "landing_page_viewed",
  FEATURES_VIEWED: "features_viewed",
  PRICING_VIEWED: "pricing_viewed",
  FAQ_VIEWED: "faq_viewed",
  CONTACT_VIEWED: "contact_viewed",

  // Acquisition
  SIGNUP_STARTED: "signup_started",
  SIGNUP_INITIATED: "signup_initiated",
  MAGIC_LINK_SENT: "magic_link_sent",
  MAGIC_LINK_VERIFIED: "magic_link_verified",
  GYM_CREATED: "gym_created",
  GYM_JOIN_INITIATED: "gym_join_initiated",
  GYM_JOINED: "gym_joined",
  
  // Marketing & Content
  NEWSLETTER_SUBSCRIBED: "newsletter_subscribed",
  BLOG_ARTICLE_VIEWED: "blog_article_viewed",
  CONTACT_FORM_SUBMITTED: "contact_form_submitted",

  // Activation
  FIRST_MEMBER_ADDED: "first_member_added",
  FIRST_PLAN_CREATED: "first_plan_created",
  FIRST_TRAINER_ADDED: "first_trainer_added",
  FIRST_PAYMENT_RECEIVED: "first_payment_received",
  FIRST_QR_SCAN: "first_qr_scan",

  // Revenue
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  PLAN_UPGRADED: "plan_upgraded",
  PLAN_DOWNGRADED: "plan_downgraded",
  SUBSCRIPTION_RENEWED: "subscription_renewed",

  // Retention
  LOGIN: "login",
  RETURN_VISIT: "return_visit",
  ACTIVE_MEMBER: "active_member",
  REPORT_EXPORTED: "report_exported",
  AI_USED: "ai_used",
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
