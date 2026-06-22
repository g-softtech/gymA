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

export function getEntitlementFeatures(entitlements: Record<string, any>): string[] {
  const features: string[] = [];
  
  const classCount = entitlements[EntitlementKeys.MAX_CLASSES_PER_MONTH];
  if (classCount === -1) features.push("Unlimited Group Classes");
  else if (classCount > 0) features.push(`${classCount} Group Classes per month`);

  const trainerCount = entitlements[EntitlementKeys.MAX_TRAINER_SESSIONS];
  if (trainerCount === -1) features.push("Unlimited PT Sessions");
  else if (trainerCount > 0) features.push(`${trainerCount} Personal Trainer Sessions`);
  else if (trainerCount === 0) features.push("No Trainer Sessions included");

  if (entitlements[EntitlementKeys.AI_ACCESS]) {
    features.push("AI Coach Access");
  }

  const aiRequests = entitlements[EntitlementKeys.MAX_AI_REQUESTS];
  if (aiRequests === -1) features.push("Unlimited AI Requests");
  else if (aiRequests > 0) features.push(`Up to ${aiRequests} AI requests / month`);

  if (entitlements[EntitlementKeys.PRIORITY_BOOKING]) {
    features.push("Priority Booking");
  }

  if (entitlements[EntitlementKeys.SAUNA_ACCESS]) {
    features.push("Sauna Access");
  }

  return features;
}

