import { create } from "zustand";

interface TranslationState {
  isTranslated: boolean;
  isInitialized: boolean;
  toggleTranslation: () => void;
  setInitialized: () => void;
  setIsTranslated: (value: boolean) => void; 
}

export const useTranslationStore = create<TranslationState>((set) => ({
  isTranslated: false,
  isInitialized: false,
  toggleTranslation: () => set((state) => ({ isTranslated: !state.isTranslated })),
  setInitialized: () => set({ isInitialized: true }),
  setIsTranslated: (value) => set({ isTranslated: value }), 
}));