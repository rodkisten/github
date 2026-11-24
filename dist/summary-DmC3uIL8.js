import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CtzvHsHd.js";
// src/utils/summary.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
var SummaryBuilder = class {
	table(rows) {
		if (rows.length === 0) return this;
		const headers = Object.keys(rows[0]);
		const headerRow = headers.map((h) => ({
			data: h,
			header: true
		}));
		const dataRows = rows.map((row) => headers.map((h) => String(row[h] ?? "")));
		import_core.summary.addTable([headerRow, ...dataRows]);
		return this;
	}
	kv(entries) {
		const rows = Object.entries(entries).map(([key, value]) => [{ data: `<strong>${key}</strong>` }, { data: String(value) }]);
		if (rows.length > 0) import_core.summary.addTable(rows);
		return this;
	}
	heading(text, level = 2) {
		import_core.summary.addHeading(text, level);
		return this;
	}
	text(content) {
		import_core.summary.addRaw(content, true);
		return this;
	}
	code(content, lang = "json") {
		import_core.summary.addCodeBlock(content, lang);
		return this;
	}
	details(label, content, lang) {
		const body = lang ? `\n\`\`\`${lang}\n${content}\n\`\`\`\n` : `\n${content}\n`;
		import_core.summary.addDetails(label, body);
		return this;
	}
	quote(text) {
		import_core.summary.addQuote(text);
		return this;
	}
	separator() {
		import_core.summary.addSeparator();
		return this;
	}
	async publish(title, sections) {
		if (!process.env.GITHUB_STEP_SUMMARY) return;
		import_core.summary.addHeading(title, 2);
		for (const section of sections) {
			if (section.text) this.text(section.text);
			const entries = section.kv ?? section.keyValue;
			if (entries) this.kv(entries);
			if (section.table) this.table(section.table);
			if (section.details) this.details(section.details.summary, section.details.content, section.details.codeLang);
		}
		await import_core.summary.write();
	}
	async write() {
		if (!process.env.GITHUB_STEP_SUMMARY) return;
		await import_core.summary.write();
	}
};
const summary = new SummaryBuilder();
export { summary as t };
