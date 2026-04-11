import { create } from 'zustand';
import type { POI, POICategory } from '@/types';

interface POIState {
  pois: POI[];
  activeCategories: Set<POICategory>;
  searchQuery: string;
  isLoading: boolean;
  selectedPOI: POI | null;
  
  setPOIs: (pois: POI[]) => void;
  addPOI: (poi: POI) => void;
  clearPOIs: () => void;
  toggleCategory: (cat: POICategory) => void;
  setSearchQuery: (q: string) => void;
  setIsLoading: (v: boolean) => void;
  setSelectedPOI: (poi: POI | null) => void;
}

export const usePOIStore = create<POIState>((set) => ({
  pois: [],
  activeCategories: new Set<POICategory>(),
  searchQuery: '',
  isLoading: false,
  selectedPOI: null,
  
  setPOIs: (pois) => set({ pois }),
  addPOI: (poi) => set((s) => ({ pois: [...s.pois, poi] })),
  clearPOIs: () => set({ pois: [] }),
  toggleCategory: (cat) => set((s) => {
    const newSet = new Set(s.activeCategories);
    if (newSet.has(cat)) newSet.delete(cat); else newSet.add(cat);
    return { activeCategories: newSet };
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setIsLoading: (v) => set({ isLoading: v }),
  setSelectedPOI: (poi) => set({ selectedPOI: poi }),
}));
