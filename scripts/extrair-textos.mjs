// Varre o código atrás de t("chave", "Texto em português") e gera src/lang/pt.js (lista de todas as chaves).
// Também avisa quais chaves ainda não têm tradução em en.js e es.js.
// Uso:  node scripts/extrair-textos.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(raiz, "src");
const arquivos = [];
(function varrer(d) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, n.name);
    if (n.isDirectory()) { if (n.name !== "lang") varrer(p); }
    else if (/\.(jsx?|mjs)$/.test(n.name) && n.name !== "i18n.js") arquivos.push(p);
  }
})(src);

const re = /(?<![\w.$])t\(\s*"((?:[^"\\\n]|\\.)*)"\s*,\s*"((?:[^"\\\n]|\\.)*)"/g;
const chaves = new Map();
const conflitos = [];
for (const a of arquivos) {
  const txt = fs.readFileSync(a, "utf8");
  let m;
  while ((m = re.exec(txt))) {
    let k, v;
    try { k = JSON.parse('"' + m[1] + '"'); v = JSON.parse('"' + m[2] + '"'); } catch (e) { continue; }
    if (chaves.has(k) && chaves.get(k) !== v) conflitos.push(`${k}: "${chaves.get(k)}" ≠ "${v}" (${path.relative(raiz, a)})`);
    else chaves.set(k, v);
  }
}
// pares ["chave.assim", "Texto"] (tabelas de mensagens, como as da IA)
const reRotulo = /\[\s*"([a-z][\w]*\.[\w.]+)"\s*,\s*"((?:[^"\\\n]|\\.)*)"\s*\]/g;
for (const a of arquivos) {
  const txt = fs.readFileSync(a, "utf8"); let m;
  while ((m = reRotulo.exec(txt))) { try { const k = JSON.parse('"' + m[1] + '"'), v = JSON.parse('"' + m[2] + '"'); if (!chaves.has(k)) chaves.set(k, v); } catch (e) { /* ignora */ } }
}
const ordenadas = [...chaves.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const corpo = ordenadas.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
fs.writeFileSync(path.join(src, "lang", "pt.js"), `// GERADO por scripts/extrair-textos.mjs — não edite à mão. Serve de guia para tradutores.\nexport default {\n${corpo}\n};\n`);
console.log(`${ordenadas.length} chaves em src/lang/pt.js`);
if (conflitos.length) { console.log("\nATENÇÃO — mesma chave com textos diferentes:"); conflitos.forEach((c) => console.log("  " + c)); }
for (const id of ["en", "es"]) {
  const d = (await import(pathToFileURL(path.join(src, "lang", id + ".js")).href)).default;
  const falta = ordenadas.filter(([k]) => !d[k]).map(([k]) => k);
  const sobra = Object.keys(d).filter((k) => !chaves.has(k) && !/^(livro\.\w+$|sermao\.tipo\.|ord\.|sermao\.(aplicacao|conclusao|apelo)$)/.test(k));
  console.log(`\n[${id}] traduzidas: ${ordenadas.length - falta.length}/${ordenadas.length}` + (falta.length ? `\n  faltam: ${falta.slice(0, 40).join(", ")}${falta.length > 40 ? " …" : ""}` : "") + (sobra.length ? `\n  chaves sem uso: ${sobra.join(", ")}` : ""));
}
