// LLM API 调用 - 支持 Anthropic + OpenAI 兼容格式
import {ApiConfig} from '../types';
import {SYSTEM_PROMPT} from './promptBuilder';

// 超时时间 60 秒
const TIMEOUT_MS = 60000;

// 判断 API 格式：baseUrl 含 anthropic → Anthropic 格式，否则 OpenAI 兼容格式
function getApiFormat(baseUrl: string): 'anthropic' | 'openai_compatible' {
  return baseUrl.includes('anthropic') ? 'anthropic' : 'openai_compatible';
}

// 调用 LLM API，返回响应文本
export async function callLlmApi(
  config: ApiConfig,
  userPrompt: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const format = getApiFormat(config.baseUrl);
    const response = await fetchWithFormat(config, userPrompt, format, controller.signal);
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 根据格式发送请求
async function fetchWithFormat(
  config: ApiConfig,
  userPrompt: string,
  format: 'anthropic' | 'openai_compatible',
  signal: AbortSignal,
): Promise<string> {
  if (format === 'anthropic') {
    return fetchAnthropic(config, userPrompt, signal);
  } else {
    return fetchOpenAICompatible(config, userPrompt, signal);
  }
}

// Anthropic 格式请求
async function fetchAnthropic(
  config: ApiConfig,
  userPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: SYSTEM_PROMPT + '\n\n' + userPrompt,
        },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API请求失败(${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error('API返回内容为空');
  }
  return text;
}

// OpenAI 兼容格式请求
async function fetchOpenAICompatible(
  config: ApiConfig,
  userPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  // baseUrl 末尾去斜杠再拼接
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      temperature: 0.9,
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: userPrompt},
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API请求失败(${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('API返回内容为空');
  }
  return text;
}

// 测试连接：发送"你好，请回复连接成功"，不抛异常即成功
export async function testConnection(config: ApiConfig): Promise<void> {
  await callLlmApi(config, '你好，请回复连接成功');
}
