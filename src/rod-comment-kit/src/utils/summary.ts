import * as core from '@actions/core';

export type SummaryRow = Record<string, string | number | boolean>;

export interface SummarySection {
  heading?: string;
  level?: 1 | 2 | 3;
  text?: string;
  table?: SummaryRow[];
  keyValue?: Record<string, string | number | boolean>;
  details?: {
    summary: string;
    content: string;
    codeLang?: string;
  };
}

class SummaryBuilder {
  table(rows: SummaryRow[]): this {
    if (rows.length === 0) return this;

    const headers = Object.keys(rows[0]);
    const headerRow = headers.map((h) => ({ data: h, header: true }));
    const dataRows = rows.map((row) => headers.map((h) => String(row[h] ?? '')));

    core.summary.addTable([headerRow, ...dataRows]);
    return this;
  }

  kv(entries: Record<string, string | number | boolean>): this {
    const rows = Object.entries(entries).map(([key, value]) => [
      { data: `<strong>${key}</strong>` },
      { data: String(value) },
    ]);

    if (rows.length > 0) {
      core.summary.addTable(rows);
    }
    return this;
  }

  heading(text: string, level: 1 | 2 | 3 = 2): this {
    core.summary.addHeading(text, level);
    return this;
  }

  text(content: string): this {
    core.summary.addRaw(content, true);
    return this;
  }

  code(content: string, lang = 'json'): this {
    core.summary.addCodeBlock(content, lang);
    return this;
  }

  details(label: string, content: string, lang?: string): this {
    const body = lang ? `\n\`\`\`${lang}\n${content}\n\`\`\`\n` : `\n${content}\n`;
    core.summary.addDetails(label, body);
    return this;
  }

  quote(text: string): this {
    core.summary.addQuote(text);
    return this;
  }

  separator(): this {
    core.summary.addSeparator();
    return this;
  }

  async publish(title: string, sections: Omit<SummarySection, 'heading'>[]): Promise<void> {
    if (!process.env.GITHUB_STEP_SUMMARY) return;

    core.summary.addHeading(title, 2);

    for (const section of sections) {
      if (section.text) this.text(section.text);
      if (section.kv) this.kv(section.kv);
      if (section.table) this.table(section.table);
      if (section.details) {
        this.details(section.details.summary, section.details.content, section.details.codeLang);
      }
    }

    await core.summary.write();
  }

  async write(): Promise<void> {
    if (!process.env.GITHUB_STEP_SUMMARY) return;
    await core.summary.write();
  }
}

export const summary = new SummaryBuilder();
