import type { ReportSection } from './render.js';

export interface GitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  previous_filename?: string;
}
export interface GitCommit {
  sha: string;
  commit: { message: string; author: { name: string } | null };
}

export function gitSections(commits: GitCommit[], files: GitFile[], totals: {
  commits: number; files: number; additions: number; deletions: number;
}): ReportSection[] {
  const directories = new Map<string, number>();
  for (const file of files) {
    const directory = file.filename.includes('/') ? file.filename.split('/')[0] : '(root)';
    directories.set(directory, (directories.get(directory) ?? 0) + 1);
  }
  return [
    { title: 'PR changes', rows: [
      { label: 'Commits', value: String(totals.commits) },
      { label: 'Files changed', value: String(totals.files) },
      { label: 'Lines', value: '+' + totals.additions + ' / -' + totals.deletions },
      { label: 'File coverage', value: files.length + ' of ' + totals.files },
    ] },
    { title: 'Commits (up to 20)', collapsed: true, rows: commits.slice(-20).map(c => ({
      label: c.sha.slice(0, 7), value: (c.commit.message.split('\n')[0] + ' · ' + (c.commit.author?.name ?? 'Unknown')).slice(0, 500),
    })) },
    { title: 'Changed files (up to 40)', collapsed: true, rows: files.slice(0, 40).map(f => ({
      label: f.status, value: ((f.previous_filename ? f.previous_filename + ' → ' : '') + f.filename + ' (+' + f.additions + ' / -' + f.deletions + ')').slice(0, 500),
    })) },
    { title: 'Top-level directories (retrieved files)', collapsed: true, rows: [...directories].sort((a,b) => b[1]-a[1]).slice(0,20).map(([label,count]) => ({label,value:String(count)})) },
  ];
}

export function previousVerifiedSha(body: string | undefined): string | undefined {
  return body?.match(/^<!-- rod-preview-verified-sha:([a-f0-9]{40}) -->$/m)?.[1];
}
