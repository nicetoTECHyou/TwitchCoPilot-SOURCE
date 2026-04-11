import { create } from 'zustand';
import type { ChatMessage, TwitchAlert, BotCommand, BanRecord, VoteSession } from '@/types';

interface TwitchState {
  connected: boolean;
  channel: string;
  botName: string;
  token: string;
  autoConnect: boolean;
  messages: ChatMessage[];
  alerts: TwitchAlert[];
  commands: BotCommand[];
  bans: BanRecord[];
  activeVote: VoteSession | null;
  pendingWaypoints: any[];
  approvedWaypoints: any[];
  
  // Actions
  setConnected: (v: boolean) => void;
  setConnectionInfo: (ch: string, bot: string, tok: string) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  setAlerts: (a: TwitchAlert[]) => void;
  addAlert: (a: TwitchAlert) => void;
  updateAlert: (id: string, data: Partial<TwitchAlert>) => void;
  deleteAlert: (id: string) => void;
  setCommands: (c: BotCommand[]) => void;
  addCommand: (c: BotCommand) => void;
  updateCommand: (id: string, data: Partial<BotCommand>) => void;
  deleteCommand: (id: string) => void;
  addBan: (b: BanRecord) => void;
  setVote: (v: VoteSession | null) => void;
  addPendingWaypoint: (wp: any) => void;
  approveWaypoint: (id: string) => void;
  rejectWaypoint: (id: string) => void;
  clearWaypoints: () => void;

  // Bridge functions (registered by TwitchChatManager, consumed by other components)
  _connectFn: (() => void) | undefined;
  _disconnectFn: (() => void) | undefined;
  _sendChatFn: ((msg: string) => void) | undefined;
}

export const useTwitchStore = create<TwitchState>((set) => ({
  connected: false,
  channel: '',
  botName: '',
  token: '',
  autoConnect: false,
  messages: [],
  alerts: [],
  commands: [],
  bans: [],
  activeVote: null,
  pendingWaypoints: [],
  approvedWaypoints: [],
  
  setConnected: (v) => set({ connected: v }),
  setConnectionInfo: (channel, botName, token) => set({ channel, botName, token }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages.slice(-500), msg] })),
  clearMessages: () => set({ messages: [] }),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (a) => set((s) => ({ alerts: [...s.alerts, a] })),
  updateAlert: (id, data) => set((s) => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, ...data } : a) })),
  deleteAlert: (id) => set((s) => ({ alerts: s.alerts.filter(a => a.id !== id) })),
  setCommands: (commands) => set({ commands }),
  addCommand: (c) => set((s) => ({ commands: [...s.commands, c] })),
  updateCommand: (id, data) => set((s) => ({ commands: s.commands.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCommand: (id) => set((s) => ({ commands: s.commands.filter(c => c.id !== id) })),
  addBan: (b) => set((s) => ({ bans: [...s.bans, b] })),
  setVote: (v) => set({ activeVote: v }),
  addPendingWaypoint: (wp) => set((s) => ({ pendingWaypoints: [...s.pendingWaypoints, wp] })),
  approveWaypoint: (id) => set((s) => ({
    pendingWaypoints: s.pendingWaypoints.filter(w => w.id !== id),
    approvedWaypoints: [...s.approvedWaypoints, s.pendingWaypoints.find(w => w.id === id)],
  })),
  rejectWaypoint: (id) => set((s) => ({ pendingWaypoints: s.pendingWaypoints.filter(w => w.id !== id) })),
  clearWaypoints: () => set({ pendingWaypoints: [], approvedWaypoints: [] }),

  // Bridge functions (initially undefined, registered by TwitchChatManager)
  _connectFn: undefined,
  _disconnectFn: undefined,
  _sendChatFn: undefined,
}));
