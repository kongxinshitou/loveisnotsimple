// API 配置持久化 Store
import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiConfig} from '../types';

const STORAGE_KEY = 'chatmaster_settings';

// 默认配置
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://api.anthropic.com/v1/messages',
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
};

interface SettingsState {
  config: ApiConfig;
  setConfig: (config: Partial<ApiConfig>) => void;
  loadConfig: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  config: DEFAULT_CONFIG,

  // 更新并持久化配置
  setConfig: async (partial: Partial<ApiConfig>) => {
    const newConfig = {...get().config, ...partial};
    set({config: newConfig});
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {}
  },

  // 从 AsyncStorage 加载配置
  loadConfig: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({config: {...DEFAULT_CONFIG, ...parsed}});
      }
    } catch {}
  },

  // 清除所有数据并重置默认值
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch {}
    set({config: DEFAULT_CONFIG});
  },
}));

export default useSettingsStore;
