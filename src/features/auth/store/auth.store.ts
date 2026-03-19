import { create } from "zustand";
import Cookies from "js-cookie";

// Define the type of the user
interface User {
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "BILLER";
}

// Define the store state
interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User) => void;
  logout: () => void;
}

// Cookie key
const TOKEN_KEY = "derash_token";

// Create Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: Cookies.get(TOKEN_KEY) || null,

  login: (user: User) => {
    // Create fake token (since you use mock backend)
    const fakeToken = "derash_secure_token";

    Cookies.set(TOKEN_KEY, fakeToken, { expires: 1 / 24 }); // 1 hour

    set({
      user,
      token: fakeToken,
    });
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);

    set({
      user: null,
      token: null,
    });
  },
}));