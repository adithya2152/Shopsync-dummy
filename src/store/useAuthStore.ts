import { create } from "zustand";

interface AuthState {
  role: string | null;
  setRole: (role: string) => void;
  resetRole: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null, // Default role is null
  setRole: (role) => set({ role }),
  resetRole: () => set({ role: null }),
}));
