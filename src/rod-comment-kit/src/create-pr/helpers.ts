import { parseListInput } from '../utils/inputs.js';

export function parseList(value: string): string[] {
  return parseListInput(value);
}

export function appendConversationUrl(body: string, url: string): string {
  if (!url || body.includes(url)) return body;
  return [body.trim(), '## 💬 Conversation', url]
    .filter(Boolean)
    .join(String.fromCharCode(10, 10));
}
