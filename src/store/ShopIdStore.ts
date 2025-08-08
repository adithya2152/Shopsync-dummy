import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShopIdState {
  shopId: number;
  setShopId: (shopId: number) => void;
  _hasHydrated: boolean; // Add a state to track hydration
  setHasHydrated: (state: boolean) => void; // Add a setter for it
}

export const useShopIdStore = create<ShopIdState>()(
  persist(
    (set) => ({
      shopId: 0,
      setShopId: (shopId) => set({ shopId }),
      _hasHydrated: false, // Start as not hydrated
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "shopId-storage",
      // This function runs once rehydration is complete
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);