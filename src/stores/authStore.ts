import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
  email: string | null;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token: string, user: User) => {
        set({ token, user });
      },
      clearAuth: () => {
        set({ token: null, user: null });
      },
      isAuthenticated: () => {
        return get().token !== null;
      },
    }),
    {
      name: "foodbank-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
