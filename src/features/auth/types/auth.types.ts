import { UserRole } from "@/features/shared/enums";

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
}

// ✅ Add this
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}