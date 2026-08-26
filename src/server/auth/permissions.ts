export type AuthRole = "ADMIN" | "COVER_MANAGER";

const permissions = {
  ADMIN: ["manage:staff", "manage:timetable", "assign:cover", "override:cover", "view:analytics"],
  COVER_MANAGER: ["assign:cover", "view:analytics"],
} as const;

export function assertPermission(role: AuthRole, permission: (typeof permissions)[AuthRole][number]) {
  if (!permissions[role].includes(permission as never)) {
    throw new Error(`Role ${role} cannot ${permission}`);
  }
}
