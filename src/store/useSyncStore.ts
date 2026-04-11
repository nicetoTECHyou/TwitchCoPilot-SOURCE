import { create } from 'zustand';

interface SyncState {
  peerId: string;
  isConnected: boolean;
  isHost: boolean;
  error: string | null;
  setPeerId: (id: string) => void;
  setConnected: (v: boolean) => void;
  setHost: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  peerId: '',
  isConnected: false,
  isHost: false,
  error: null,
  setPeerId: (id) => set({ peerId: id }),
  setConnected: (v) => set({ isConnected: v, error: null }),
  setHost: (v) => set({ isHost: v }),
  setError: (e) => set({ error: e }),
  reset: () => set({ peerId: '', isConnected: false, isHost: false, error: null }),
}));
