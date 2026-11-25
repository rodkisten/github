import { m as summary$1 } from "./core-B0CVUTgi.js";
// src/utils/summary.ts
var SummaryBuilder = class {
	table(rows) {
		if (rows.length === 0) return this;
		const headers = Object.keys(rows[0]);
		const headerRow = headers.map((h) => ({
			data: h,
			header: true
		}));
		const dataRows = rows.map((row) => headers.map((h) => String(row[h] ?? "")));
		summary$1.addTable([headerRow, ...dataRows]);
		return this;
	}
	kv(entries) {
		const rows = Object.entries(entries).map(([key, value]) => [{ data: `<strong>${key}</strong>` }, { data: String(value) }]);
		if (rows.length > 0) summary$1.addTable(rows);
		return this;
	}
	heading(text, level = 2) {
		summary$1.addHeading(text, level);
		return this;
	}
	text(content) {
		summary$1.addRaw(content, true);
		return this;
	}
	code(content, lang = "json") {
		summary$1.addCodeBlock(content, lang);
		return this;
	}
	details(label, content, lang) {
		const body = lang ? `\n\`\`\`${lang}\n${content}\n\`\`\`\n` : `\n${content}\n`;
		summary$1.addDetails(label, body);
		return this;
	}
	quote(text) {
		summary$1.addQuote(text);
		return this;
	}
	separator() {
		summary$1.addSeparator();
		return this;
	}
	async publish(title, sections) {
		if (!process.env.GITHUB_STEP_SUMMARY) return;
		summary$1.addHeading(title, 2);
		for (const section of sections) {
			if (section.text) this.text(section.text);
			const entries = section.kv ?? section.keyValue;
			if (entries) this.kv(entries);
			if (section.table) this.table(section.table);
			if (section.details) this.details(section.details.summary, section.details.content, section.details.codeLang);
		}
		await summary$1.write();
	}
	async write() {
		if (!process.env.GITHUB_STEP_SUMMARY) return;
		await summary$1.write();
	}
};
const summary = new SummaryBuilder();
export { summary as t };
