export const SESSION_COOKIE_NAME = "giffin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const USER_ROLES = ["ADMIN", "PLANNER", "VIEWER"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export function canManageOperations(role: UserRoleValue) {
  return role === "ADMIN" || role === "PLANNER";
}
