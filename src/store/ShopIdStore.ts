import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShopIdState {
  shopId: number;
  setShopId: (shopId: number) => void;
}

export const useShopIdStore = create<ShopIdState>()(
  persist(
    (set) => ({
      shopId: 0,
      setShopId: (shopId) => set({ shopId }),
    }),
    {
      name: "shopId-storage",  
    }
  )
);
