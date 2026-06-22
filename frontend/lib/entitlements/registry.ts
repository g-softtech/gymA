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

export function getEntitlementFeatures(entitlements: Record<string, any>): { name: string; included: boolean }[] {
  const features: { name: string; included: boolean }[] = [];
  
  const classCount = entitlements[EntitlementKeys.MAX_CLASSES_PER_MONTH];
  if (classCount === -1) features.push({ name: "Unlimited Group Classes", included: true });
  else if (classCount > 0) features.push({ name: `${classCount} Group Classes per month`, included: true });
  else features.push({ name: "Group Classes", included: false });

  const trainerCount = entitlements[EntitlementKeys.MAX_TRAINER_SESSIONS];
  if (trainerCount === -1) features.push({ name: "Unlimited PT Sessions", included: true });
  else if (trainerCount > 0) features.push({ name: `${trainerCount} Personal Trainer Sessions`, included: true });
  else features.push({ name: "Personal Trainer Sessions", included: false });

  if (entitlements[EntitlementKeys.AI_ACCESS]) {
    const aiRequests = entitlements[EntitlementKeys.MAX_AI_REQUESTS];
    if (aiRequests === -1) features.push({ name: "Unlimited AI Coach Access", included: true });
    else if (aiRequests > 0) features.push({ name: `AI Coach (${aiRequests} msgs/mo)`, included: true });
    else features.push({ name: "AI Coach Access", included: true });
  } else {
    features.push({ name: "AI Coach Access", included: false });
  }

  if (entitlements[EntitlementKeys.PRIORITY_BOOKING]) {
    features.push({ name: "Priority Booking", included: true });
  } else {
    features.push({ name: "Priority Booking", included: false });
  }

  if (entitlements[EntitlementKeys.SAUNA_ACCESS]) {
    features.push({ name: "Sauna Access", included: true });
  } else {
    features.push({ name: "Sauna Access", included: false });
  }

  return features;
}

