import { describe, it, expect } from 'vitest';
import { gitSections, previousVerifiedSha } from '../src/preview-report/git.js';
describe('git intelligence', () => {
  it('uses authoritative PR totals and reports file coverage', () => {
    const sections = gitSections([], [{filename:'src/a.ts',status:'renamed',previous_filename:'old.ts',additions:2,deletions:1}], {commits:3,files:10,additions:20,deletions:5});
    expect(sections[0]?.rows[3]?.value).toBe('1 of 10');
    expect(sections[2]?.rows[0]?.value).toContain('old.ts → src/a.ts');
    expect(sections[3]?.rows[0]?.label).toBe('src');
  });
  it('reads only valid verified revision markers', () => {
    expect(previousVerifiedSha('<!-- rod-preview-verified-sha:'+'a'.repeat(40)+' -->')).toBe('a'.repeat(40));
    expect(previousVerifiedSha('<!-- rod-preview-verified-sha:bad -->')).toBeUndefined();
  });
});
