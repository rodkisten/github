export function parseList(value: string): string[] {
  return value.split(/[\\r\\n,]/).map(item => item.trim()).filter(Boolean);
}

export function appendConversationUrl(body: string, url: string): string {
  if (!url || body.includes(url)) return body;
  return [body.trim(), '## 💬 Conversation', url].filter(Boolean).join(String.fromCharCode(10, 10));
}
