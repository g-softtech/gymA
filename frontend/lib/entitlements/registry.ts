export const EntitlementKeys = {
  MAX_CLASSES_PER_MONTH: "MAX_CLASSES_PER_MONTH",
  MAX_TRAINER_SESSIONS: "MAX_TRAINER_SESSIONS",
  AI_ACCESS: "AI_ACCESS",
  MAX_AI_REQUESTS: "MAX_AI_REQUESTS",
  PRIORITY_BOOKING: "PRIORITY_BOOKING",
  SAUNA_ACCESS: "SAUNA_ACCESS",
} as const;

export type EntitlementKey = keyof typeof EntitlementKeys;

export const ENTITLEMENTS_REGISTRY = {
  [EntitlementKeys.MAX_CLASSES_PER_MONTH]: {
    label: "Max Classes per Month",
    type: "number",
    defaultValue: -1, // -1 for unlimited
    description: "Maximum number of group classes a member can book per month.",
  },
  [EntitlementKeys.MAX_TRAINER_SESSIONS]: {
    label: "Max Trainer Sessions",
    type: "number",
    defaultValue: 0,
    description: "Maximum number of 1-on-1 personal trainer sessions allowed.",
  },
  [EntitlementKeys.AI_ACCESS]: {
    label: "AI Coach Access",
    type: "boolean",
    defaultValue: false,
    description: "Whether the member can access the AI Coach.",
  },
  [EntitlementKeys.MAX_AI_REQUESTS]: {
    label: "Max AI Requests per Month",
    type: "number",
    defaultValue: 0,
    description: "Limits the number of messages sent to the AI Coach.",
  },
  [EntitlementKeys.PRIORITY_BOOKING]: {
    label: "Priority Booking",
    type: "boolean",
    defaultValue: false,
    description: "Allows member to bypass standard booking restrictions.",
  },
  [EntitlementKeys.SAUNA_ACCESS]: {
    label: "Sauna Access",
    type: "boolean",
    defaultValue: false,
    description: "Access to the gym's sauna facilities.",
  },
};
