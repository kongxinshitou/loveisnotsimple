// 剪贴板读写工具
import Clipboard from '@react-native-clipboard/clipboard';

// 读取剪贴板文本
export async function readClipboard(): Promise<string> {
  try {
    const text = await Clipboard.getString();
    return text || '';
  } catch {
    return '';
  }
}

// 写入剪贴板文本
export function writeClipboard(text: string): void {
  try {
    Clipboard.setString(text);
  } catch {}
}
