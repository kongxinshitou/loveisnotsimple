// 聊天记录格式识别工具
import {ChatMessage} from '../types';

// 解析结果
export interface ParseResult {
  messages: ChatMessage[];
  participants: string[];
  recognized: boolean;
}

// 解析聊天记录，自动识别常见格式
export function parseChatContent(raw: string): ParseResult {
  const lines = raw.split('\n').filter(l => l.trim());

  // 尝试三种格式
  const wechatResult = tryParseWechat(lines);
  if (wechatResult) return wechatResult;

  const simpleResult = tryParseSimple(lines);
  if (simpleResult) return simpleResult;

  const timestampResult = tryParseTimestamp(lines);
  if (timestampResult) return timestampResult;

  // 无法识别，原样返回
  return {
    messages: [{role: 'unknown', content: raw}],
    participants: [],
    recognized: false,
  };
}

// 微信格式：名字 2024/01/15 20:30\n消息内容
function tryParseWechat(lines: string[]): ParseResult | null {
  const wechatHeader = /^(.+?)\s+\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\s+\d{2}:\d{2}/;
  const messages: ChatMessage[] = [];
  const participants = new Set<string>();
  let currentSender = '';
  let currentContent = '';

  for (const line of lines) {
    const match = line.match(wechatHeader);
    if (match) {
      if (currentSender && currentContent) {
        messages.push({role: 'unknown', content: currentContent.trim(), timestamp: currentSender});
        participants.add(currentSender);
      }
      currentSender = match[1].trim();
      currentContent = '';
    } else if (currentSender) {
      currentContent += (currentContent ? '\n' : '') + line;
    }
  }
  if (currentSender && currentContent) {
    messages.push({role: 'unknown', content: currentContent.trim(), timestamp: currentSender});
    participants.add(currentSender);
  }

  const matchRate = messages.length / Math.max(lines.length, 1);
  if (matchRate < 0.3 || messages.length === 0) return null;

  return buildResult(messages, Array.from(participants));
}

// 简单格式：名字：消息内容
function tryParseSimple(lines: string[]): ParseResult | null {
  const simplePattern = /^([^：:]+)[：:]\s*(.+)/;
  const messages: ChatMessage[] = [];
  const participants = new Set<string>();
  let matchCount = 0;

  for (const line of lines) {
    const match = line.match(simplePattern);
    if (match) {
      matchCount++;
      const sender = match[1].trim();
      const content = match[2].trim();
      participants.add(sender);
      messages.push({role: 'unknown', content, timestamp: sender});
    }
  }

  const matchRate = matchCount / Math.max(lines.length, 1);
  if (matchRate < 0.3 || messages.length === 0) return null;

  return buildResult(messages, Array.from(participants));
}

// 时间戳格式：[20:30] 名字: 消息内容
function tryParseTimestamp(lines: string[]): ParseResult | null {
  const timestampPattern = /^\[?\d{2}:\d{2}\]?\s+([^:]+):\s*(.+)/;
  const messages: ChatMessage[] = [];
  const participants = new Set<string>();
  let matchCount = 0;

  for (const line of lines) {
    const match = line.match(timestampPattern);
    if (match) {
      matchCount++;
      const sender = match[1].trim();
      const content = match[2].trim();
      participants.add(sender);
      messages.push({role: 'unknown', content, timestamp: sender});
    }
  }

  const matchRate = matchCount / Math.max(lines.length, 1);
  if (matchRate < 0.3 || messages.length === 0) return null;

  return buildResult(messages, Array.from(participants));
}

// 根据参与者列表标记角色（默认无法确定谁是"我"）
function buildResult(messages: ChatMessage[], participants: string[]): ParseResult {
  return {
    messages,
    participants: participants.slice(0, 2), // 只取前两个参与者
    recognized: true,
  };
}

// 将解析结果格式化为 Prompt 用的文本（标记角色后）
export function formatChatForPrompt(
  raw: string,
  parseResult: ParseResult,
  myName?: string,
): string {
  if (!parseResult.recognized || !myName) {
    // 无法识别或未指定，加提示后原样发送
    if (!parseResult.recognized) {
      return '以下是原始聊天内容，请自行分辨双方角色：\n\n' + raw;
    }
    return raw;
  }

  // 按角色替换
  const formatted = parseResult.messages.map(msg => {
    const sender = msg.timestamp || '';
    const role = sender === myName ? '我' : '她';
    return `${role}：${msg.content}`;
  });

  return formatted.join('\n');
}
