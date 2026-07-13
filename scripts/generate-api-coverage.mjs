#!/usr/bin/env node
// Generates the "API coverage" README section from both catalogs:
//   src/catalog/index.json      (Reports API v2 catalog)
//   src/catalog-db/index.json   (Database API v0 catalog)
// Usage: node scripts/generate-api-coverage.mjs > coverage.md
// Every report and endpoint is listed, no sampling. Regenerate whenever a catalog changes.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reportsIndex = JSON.parse(readFileSync(join(root, "src", "catalog", "index.json"), "utf8"));
const dbIndex = JSON.parse(readFileSync(join(root, "src", "catalog-db", "index.json"), "utf8"));

const reports = reportsIndex.reports;
const endpoints = dbIndex.endpoints;

const groupBy = (items, key) => {
  const map = new Map();
  for (const item of items) {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
};

const reportCats = groupBy(reports, "category");
const dbCats = groupBy(endpoints, "category");

const out = [];
out.push(
  `${reports.length + endpoints.length} operations covered: ${reports.length} reports (Reports API v2) and ${endpoints.length} endpoints (Database API v0).`
);
out.push("");
out.push("| Category | Operations |");
out.push("|---|---|");
for (const [cat, items] of reportCats) out.push(`| Reports: ${cat} | ${items.length} |`);
for (const [cat, items] of dbCats) out.push(`| Database API: ${cat} | ${items.length} |`);
out.push("");

for (const [cat, items] of reportCats) {
  out.push("<details>");
  out.push(`<summary><strong>Reports: ${cat}</strong> (${items.length} reports)</summary>`);
  out.push("");
  out.push("| Report | ID |");
  out.push("|---|---|");
  for (const r of [...items].sort((a, b) => a.slug.localeCompare(b.slug))) {
    out.push(`| ${r.name} | \`${r.slug}\` |`);
  }
  out.push("");
  out.push("</details>");
  out.push("");
}

for (const [cat, items] of dbCats) {
  out.push("<details>");
  out.push(`<summary><strong>Database API: ${cat}</strong> (${items.length} endpoints)</summary>`);
  out.push("");
  out.push("| Method | Path | Operation ID |");
  out.push("|---|---|---|");
  const sorted = [...items].sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
  );
  for (const e of sorted) {
    out.push(`| ${e.method} | \`${e.path}\` | \`${e.operationId}\` |`);
  }
  out.push("");
  out.push("</details>");
  out.push("");
}

process.stdout.write(out.join("\n"));
