export enum Permission {
  // Member Management
  VIEW_MEMBERS = "VIEW_MEMBERS",
  CREATE_MEMBERS = "CREATE_MEMBERS",
  UPDATE_MEMBERS = "UPDATE_MEMBERS",
  DELETE_MEMBERS = "DELETE_MEMBERS",

  // Billing
  VIEW_BILLING = "VIEW_BILLING",
  EDIT_BILLING = "EDIT_BILLING",

  // Operations
  VIEW_INTELLIGENCE = "VIEW_INTELLIGENCE",
  EDIT_SETTINGS = "EDIT_SETTINGS",

  // Trainer Specific
  MANAGE_WORKOUTS = "MANAGE_WORKOUTS",
  MANAGE_SCHEDULE = "MANAGE_SCHEDULE",

  // Superadmin
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
}

export type Role = "MEMBER" | "TRAINER" | "ADMIN" | "SUPERADMIN";

const rolePermissions: Record<Role, Permission[]> = {
  MEMBER: [],
  TRAINER: [
    Permission.VIEW_MEMBERS,
    Permission.MANAGE_WORKOUTS,
    Permission.MANAGE_SCHEDULE,
  ],
  ADMIN: [
    Permission.VIEW_MEMBERS,
    Permission.CREATE_MEMBERS,
    Permission.UPDATE_MEMBERS,
    Permission.DELETE_MEMBERS,
    Permission.VIEW_BILLING,
    Permission.EDIT_BILLING,
    Permission.VIEW_INTELLIGENCE,
    Permission.EDIT_SETTINGS,
    Permission.MANAGE_WORKOUTS,
    Permission.MANAGE_SCHEDULE,
  ],
  SUPERADMIN: [
    Permission.SYSTEM_ADMIN, // Superadmin bypasses all checks usually
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  if (role === "SUPERADMIN") return true;
  
  const permissions = rolePermissions[role as Role];
  if (!permissions) return false;
  
  return permissions.includes(permission);
}
