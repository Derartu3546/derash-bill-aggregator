export const UserRole = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
  BILLER: "BILLER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];