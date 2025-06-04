import type { Item } from '@/lib/schema';
import { create } from 'zustand';

interface ItemsState {
  localItems: Item[];
  setLocalItems: (items: Item[]) => void;
  resetOrder: () => void;
}

export const useItemsStore = create<ItemsState>((set) => ({
  localItems: [],
  setLocalItems: (items) => set({ localItems: items }),
  resetOrder: () => set((state) => ({ 
    localItems: state.localItems
        .map((item) => ({
          ...item,
          index: item.id - 1
        }))
        .sort((a, b) => a.index - b.index), 
    }))
}));