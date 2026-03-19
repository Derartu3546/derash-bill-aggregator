// src/features/auth/api/auth.api.ts
interface User {
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "BILLER";
}

interface LoginResponse {
  user: User;
}

const users: User[] = [
  { name: "Admin User", email: "admin@derash.com", role: "ADMIN" },
  { name: "Agent User", email: "agent@derash.com", role: "AGENT" },
  { name: "Biller User", email: "biller@derash.com", role: "BILLER" },
];

// Mock login API
export const loginApi = (email: string, password: string): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    const user = users.find(u => u.email === email);
    // Simple password check for mock
    if (user && password.includes(user.role.toLowerCase())) {
      resolve({ user });
    } else {
      reject(new Error("Invalid credentials"));
    }
  });
};