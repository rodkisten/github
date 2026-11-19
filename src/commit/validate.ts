export type FileChange = { path: string; content: string; encoding?: 'utf-8' | 'base64' };

export function validateChanges(changes: unknown): asserts changes is FileChange[] {
  if (!Array.isArray(changes) || changes.length === 0) throw new Error('files must be a non-empty JSON array');
  const seen = new Set<string>();
  for (const file of changes as FileChange[]) {
    if (!file || typeof file.path !== 'string' || !file.path.trim() || file.path.startsWith('/') || file.path.split('/').includes('..')) {
      throw new Error(`Unsafe file path: ${file?.path}`);
    }
    if (seen.has(file.path)) throw new Error(`Duplicate file path: ${file.path}`);
    seen.add(file.path);
    if (typeof file.content !== 'string') throw new Error(`Missing content for ${file.path}`);
    if (file.encoding && file.encoding !== 'utf-8' && file.encoding !== 'base64') throw new Error(`Unsupported encoding for ${file.path}`);
  }
}
