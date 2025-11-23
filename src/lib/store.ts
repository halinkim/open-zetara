import { create } from 'zustand';

interface AppState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    selectedPaperId: number | null;
    setSelectedPaperId: (id: number | null) => void;
    navigationTarget: { pdfId: number; page: number; rect?: { x: number; y: number; width: number; height: number } } | null;
    setNavigationTarget: (target: { pdfId: number; page: number; rect?: { x: number; y: number; width: number; height: number } } | null) => void;
    lastUpdate: number;
    triggerUpdate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    selectedPaperId: null,
    setSelectedPaperId: (id) => set({ selectedPaperId: id }),
    navigationTarget: null,
    setNavigationTarget: (target) => set({ navigationTarget: target }),
    lastUpdate: 0,
    triggerUpdate: () => set({ lastUpdate: Date.now() }),
}));
