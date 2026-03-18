// 全局 TypeScript 类型定义

// 聊天消息
export interface ChatMessage {
  role: 'me' | 'her' | 'unknown';
  content: string;
  timestamp?: string;
}

// 回复风格
export type ReplyStyle = 'flirty' | 'humor' | 'affectionate' | 'high_value';

// 单条回复建议
export interface Suggestion {
  index: number;
  replyText: string;
  styleTags: string[];
  score: number; // 1-5
  analysis: string;
}

// 分析结果
export interface AnalysisResult {
  overallAnalysis: string;
  suggestions: Suggestion[];
  rawText: string; // 降级展示用
}

// 历史记录条目
export interface HistoryEntry {
  id: string;
  chatPreview: string; // 前50字
  fullChat: string;
  style: ReplyStyle;
  result: AnalysisResult;
  createdAt: number;
}

// 人设信息（男方/女方通用）
export interface CharacterProfile {
  name: string;         // 昵称
  age: string;          // 年龄
  personality: string;  // 性格特点
  background: string;   // 职业/背景
  interests: string;    // 兴趣爱好
  notes: string;        // 其他备注
}

// 女方人物画像分析结果
export interface FemalePortrait {
  personalityType: string;    // 性格类型
  interestLevel: string;      // 对男方兴趣度
  communicationStyle: string; // 沟通风格
  emotionalState: string;     // 当前情感状态
  weaknesses: string;         // 攻略弱点
  strategies: string[];       // 攻略策略建议
  rawText: string;            // 原始文本（降级用）
}

// 会话（对应一个女生的所有聊天记录和分析）
export interface Session {
  id: string;
  name: string;                      // 会话名（如女生昵称）
  maleProfile: CharacterProfile;     // 男方人设
  femaleProfile: CharacterProfile;   // 女方人设
  femalePortrait?: FemalePortrait;   // 女方画像（分析后才有）
  entries: HistoryEntry[];           // 该会话的历史分析记录
  createdAt: number;
  updatedAt: number;
}

// API 配置
export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// API 格式类型
export type ApiFormat = 'anthropic' | 'openai_compatible';
