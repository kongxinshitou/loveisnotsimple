// 会话管理持久化 Store（V0.2 新增，支持多会话）
import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Session, HistoryEntry, CharacterProfile, FemalePortrait} from '../types';

const STORAGE_KEY = 'chatmaster_sessions';
const MAX_ENTRIES_PER_SESSION = 50;

// 默认空人设
export const DEFAULT_PROFILE: CharacterProfile = {
  name: '',
  age: '',
  personality: '',
  background: '',
  interests: '',
  notes: '',
};

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  // 创建新会话
  createSession: (name: string) => Session;
  // 更新会话元数据（名称、人设等）
  updateSession: (id: string, partial: Partial<Omit<Session, 'id' | 'entries' | 'createdAt'>>) => Promise<void>;
  // 删除会话
  deleteSession: (id: string) => Promise<void>;
  // 在指定会话中添加分析记录
  addEntryToSession: (sessionId: string, entry: HistoryEntry) => Promise<void>;
  // 更新女方画像
  updatePortrait: (sessionId: string, portrait: FemalePortrait) => Promise<void>;
  // 设置当前会话
  setCurrentSession: (id: string | null) => void;
  // 从 AsyncStorage 加载
  loadSessions: () => Promise<void>;
  // 清空所有会话
  clearAllSessions: () => Promise<void>;
}

// 持久化到 AsyncStorage
const saveSessions = async (sessions: Session[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
};

const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,

  // 创建新会话（返回创建的会话对象，方便调用方立即跳转）
  createSession: (name: string) => {
    const now = Date.now();
    const newSession: Session = {
      id: now.toString(),
      name: name.trim() || '新会话',
      maleProfile: {...DEFAULT_PROFILE},
      femaleProfile: {...DEFAULT_PROFILE},
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
    const sessions = [newSession, ...get().sessions];
    set({sessions, currentSessionId: newSession.id});
    saveSessions(sessions);
    return newSession;
  },

  // 更新会话（人设/名称/画像等）
  updateSession: async (id, partial) => {
    const sessions = get().sessions.map(s =>
      s.id === id ? {...s, ...partial, updatedAt: Date.now()} : s,
    );
    set({sessions});
    await saveSessions(sessions);
  },

  // 删除会话
  deleteSession: async (id: string) => {
    const sessions = get().sessions.filter(s => s.id !== id);
    const currentSessionId =
      get().currentSessionId === id ? null : get().currentSessionId;
    set({sessions, currentSessionId});
    await saveSessions(sessions);
  },

  // 在指定会话中添加记录
  addEntryToSession: async (sessionId: string, entry: HistoryEntry) => {
    const sessions = get().sessions.map(s => {
      if (s.id !== sessionId) {return s;}
      const entries = [entry, ...s.entries].slice(0, MAX_ENTRIES_PER_SESSION);
      return {...s, entries, updatedAt: Date.now()};
    });
    set({sessions});
    await saveSessions(sessions);
  },

  // 更新女方画像
  updatePortrait: async (sessionId: string, portrait: FemalePortrait) => {
    const sessions = get().sessions.map(s =>
      s.id === sessionId
        ? {...s, femalePortrait: portrait, updatedAt: Date.now()}
        : s,
    );
    set({sessions});
    await saveSessions(sessions);
  },

  // 设置当前会话
  setCurrentSession: (id: string | null) => {
    set({currentSessionId: id});
  },

  // 加载所有会话
  loadSessions: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Session[] = JSON.parse(stored);
        set({sessions: parsed});
      }
    } catch {}
  },

  // 清空所有会话
  clearAllSessions: async () => {
    set({sessions: [], currentSessionId: null});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
}));

export default useSessionStore;
