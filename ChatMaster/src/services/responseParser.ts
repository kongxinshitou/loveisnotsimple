// LLM 返回文本正则解析 + 降级处理
// 核心原则：无论如何都要给用户展示内容，绝不白屏
import {AnalysisResult, Suggestion, FemalePortrait} from '../types';

// 解析 LLM 返回的完整文本
export function parseResponse(rawText: string): AnalysisResult {
  try {
    const suggestions = parseSuggestions(rawText);
    const overallAnalysis = parseOverallAnalysis(rawText);

    // 降级策略：suggestions 为空时，将整个 rawText 写入 overallAnalysis
    if (suggestions.length === 0) {
      return {
        overallAnalysis: rawText,
        suggestions: [],
        rawText,
      };
    }

    return {
      overallAnalysis,
      suggestions,
      rawText,
    };
  } catch {
    // 任何异常都降级处理
    return {
      overallAnalysis: rawText,
      suggestions: [],
      rawText,
    };
  }
}

// 提取整体分析（### 建议1 之前的内容）
function parseOverallAnalysis(rawText: string): string {
  const firstSuggestionIndex = rawText.search(/###\s*建议\s*1/);
  if (firstSuggestionIndex === -1) {
    return rawText;
  }
  // 截取建议1之前的内容，去掉标题行
  const before = rawText.slice(0, firstSuggestionIndex).trim();
  // 去掉可能的 ## 标题行
  return before.replace(/^##.*\n?/gm, '').trim();
}

// 提取所有建议
function parseSuggestions(rawText: string): Suggestion[] {
  // 按 ### 建议N 分割
  const parts = rawText.split(/###\s*建议\s*(\d+)/);
  // parts 格式: [before, "1", block1, "2", block2, ...]
  const suggestions: Suggestion[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const index = parseInt(parts[i], 10);
    const block = parts[i + 1] || '';
    const suggestion = parseSuggestionBlock(block, index);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

// 解析单个建议块
function parseSuggestionBlock(block: string, index: number): Suggestion | null {
  // 提取各字段
  const replyText = extractField(block, '回复内容');
  const styleTagsRaw = extractField(block, '风格标签');
  const scoreRaw = extractField(block, '吸引力评分');
  const analysis = extractField(block, '策略解析');

  if (!replyText) {
    return null;
  }

  // 解析风格标签（按 /、,、，分割）
  const styleTags = styleTagsRaw
    ? styleTagsRaw.split(/[\/,，]/).map(t => t.trim()).filter(Boolean)
    : [];

  // 解析评分（提取数字，范围外默认3星）
  const scoreMatch = scoreRaw?.match(/(\d+)/);
  let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 3;
  if (score < 1 || score > 5) {
    score = 3;
  }

  return {
    index,
    replyText,
    styleTags,
    score,
    analysis: analysis || '',
  };
}

// 从建议块中提取指定字段的值
function extractField(block: string, fieldName: string): string {
  // 匹配格式：- 字段名[：:] 内容，直到下一个字段或新块
  const regex = new RegExp(
    `-\\s*${fieldName}[：:]\\s*(.+?)(?=\\n-\\s|\\n###|$)`,
    's',
  );
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

// ===================== 女方画像解析（V0.2 新增）=====================

// 解析女方人物画像 LLM 返回文本
export function parsePortraitResult(rawText: string): FemalePortrait {
  try {
    const personalityType = extractPortraitSection(rawText, '性格类型');
    const interestLevel = extractPortraitSection(rawText, '对男方兴趣度');
    const communicationStyle = extractPortraitSection(rawText, '沟通风格');
    const emotionalState = extractPortraitSection(rawText, '当前情感状态');
    const weaknesses = extractPortraitSection(rawText, '攻略弱点');
    const strategiesRaw = extractPortraitSection(rawText, '攻略策略');

    // 解析攻略策略（按序号行分割）
    const strategies = strategiesRaw
      ? strategiesRaw
          .split(/\n/)
          .map(line => line.replace(/^\d+[.、]\s*/, '').trim())
          .filter(line => line.length > 0)
      : [];

    // 若所有字段均为空，则降级展示原始文本
    if (!personalityType && !interestLevel && !communicationStyle) {
      return {
        personalityType: '',
        interestLevel: '',
        communicationStyle: '',
        emotionalState: '',
        weaknesses: '',
        strategies: [],
        rawText,
      };
    }

    return {
      personalityType,
      interestLevel,
      communicationStyle,
      emotionalState,
      weaknesses,
      strategies,
      rawText,
    };
  } catch {
    return {
      personalityType: '',
      interestLevel: '',
      communicationStyle: '',
      emotionalState: '',
      weaknesses: '',
      strategies: [],
      rawText,
    };
  }
}

// 提取画像中指定 ### 标题下的内容
function extractPortraitSection(rawText: string, sectionName: string): string {
  const regex = new RegExp(
    `###\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n###|$)`,
    'i',
  );
  const match = rawText.match(regex);
  return match ? match[1].trim() : '';
}
