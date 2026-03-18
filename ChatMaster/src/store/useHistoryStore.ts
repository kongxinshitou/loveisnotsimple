// 历史记录持久化 Store
import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {HistoryEntry} from '../types';

const STORAGE_KEY = 'chatmaster_history';
const MAX_ENTRIES = 50;

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],

  // 添加历史记录（按时间倒序，最多50条）
  addEntry: async (entry: HistoryEntry) => {
    const newEntries = [entry, ...get().entries].slice(0, MAX_ENTRIES);
    set({entries: newEntries});
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch {}
  },

  // 从 AsyncStorage 加载历史记录
  loadHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({entries: parsed});
      }
    } catch {}
  },

  // 清空历史记录
  clearHistory: async () => {
    set({entries: []});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
}));

export default useHistoryStore;
