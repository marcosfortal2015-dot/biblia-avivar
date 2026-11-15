// Gerador de PDF simples (texto), sem bibliotecas: baixa um arquivo .pdf de verdade, também no celular.
// Usa as fontes padrão do PDF (Helvetica), com acentos do português (codificação WinAnsi).
//
// gerarPDF({ titulo, subtitulo, rodape, blocos }) -> Uint8Array
//   blocos: [{ t:"h1"|"h2"|"h3"|"p"|"li"|"meta"|"cit"|"hr"|"salto", x:"texto" }]
//   h1 título grande · h2 seção (com filete dourado) · h3 subtítulo · p parágrafo · li item de lista
//   meta linha pequena e cinza · cit citação em itálico · hr linha · salto = nova página

const W = 595.28, H = 841.89, MX = 56, MT = 64, MB = 60;
// larguras (milésimos de em) das fontes Helvetica e Helvetica-Bold para os caracteres ASCII 32..126
const REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const NEG = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
const BASE_ASCII = (ch) => {
  const c = ch.normalize("NFD").charCodeAt(0);
  return c >= 32 && c <= 126 ? c : 0;
};
function larguraCh(ch, negrito) {
  const a = BASE_ASCII(ch);
  const tab = negrito ? NEG : REG;
  if (a) return tab[a - 32];
  if (ch === "•") return 350;
  if (/[–“”‘’…]/.test(ch)) return ch === "–" ? 556 : ch === "…" ? 1000 : ch === "‘" || ch === "’" ? 222 : 333;
  if (ch === "—") return 1000;
  return 556;
}
export function larguraTexto(s, tam, negrito = false) {
  let t = 0; for (const ch of String(s)) t += larguraCh(ch, negrito);
  return (t * tam) / 1000;
}
// Unicode -> byte WinAnsi (cp1252). O que não existir vira "?".
const CP1252 = { "€": 128, "‚": 130, "ƒ": 131, "„": 132, "…": 133, "†": 134, "‡": 135, "ˆ": 136, "‰": 137, "Š": 138, "‹": 139, "Œ": 140, "Ž": 142, "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149, "–": 150, "—": 151, "˜": 152, "™": 153, "š": 154, "›": 155, "œ": 156, "ž": 158, "Ÿ": 159 };
function bytes(s) {
  let out = "";
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if (c === 0x0a || c === 0x0d || c === 0x09) { out += " "; continue; }
    if (CP1252[ch]) out += String.fromCharCode(CP1252[ch]);
    else if (c >= 32 && c <= 126) out += ch;
    else if (c >= 160 && c <= 255) out += String.fromCharCode(c);
    else if (c === 0x2192 || c === 0x25b8) out += ">";
    else out += "?";
  }
  return out;
}
const esc = (s) => bytes(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function quebrar(texto, tam, negrito, maxW) {
  const palavras = String(texto).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const linhas = []; let atual = "";
  const cabe = (s) => larguraTexto(s, tam, negrito) * 1.015 <= maxW;
  for (let p of palavras) {
    while (!cabe(p) && p.length > 1) { // palavra maior que a linha: corta
      let n = p.length; while (n > 1 && !cabe(p.slice(0, n))) n--;
      if (atual) { linhas.push(atual); atual = ""; }
      linhas.push(p.slice(0, n)); p = p.slice(n);
    }
    const t = atual ? atual + " " + p : p;
    if (cabe(t)) atual = t; else { if (atual) linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas.length ? linhas : [""];
}

const ESTILOS = {
  h1: { tam: 20, neg: true, cor: "0.13 0.10 0.20", antes: 0, depois: 6, ent: 1.2 },
  h2: { tam: 14, neg: true, cor: "0.55 0.44 0.12", antes: 14, depois: 5, ent: 1.25, filete: true },
  h3: { tam: 11.5, neg: true, cor: "0.13 0.10 0.20", antes: 8, depois: 3, ent: 1.25 },
  p: { tam: 11, neg: false, cor: "0.14 0.12 0.19", antes: 0, depois: 6, ent: 1.4 },
  li: { tam: 11, neg: false, cor: "0.14 0.12 0.19", antes: 0, depois: 3, ent: 1.4, recuo: 14, marca: true },
  meta: { tam: 9.5, neg: false, cor: "0.45 0.42 0.38", antes: 0, depois: 4, ent: 1.35 },
  cit: { tam: 11, neg: false, cor: "0.30 0.24 0.45", antes: 2, depois: 6, ent: 1.4, recuo: 12, italico: true, barra: true },
};

export function gerarPDF({ titulo = "", subtitulo = "", rodape = "", blocos = [] }) {
  const paginas = []; let cont = []; let y = H - MT;
  const nova = () => { paginas.push(cont); cont = []; y = H - MT; };
  const texto = (x, yy, s, tam, fonte, cor) => cont.push(`BT /${fonte} ${tam} Tf ${cor} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${esc(s)}) Tj ET`);
  const todos = [];
  if (titulo) todos.push({ t: "h1", x: titulo });
  if (subtitulo) todos.push({ t: "meta", x: subtitulo });
  todos.push(...blocos);
  for (const b of todos) {
    if (b.t === "salto") { if (cont.length) nova(); continue; }
    if (b.t === "hr") { if (y - 12 < MB) nova(); cont.push(`0.8 0.75 0.65 RG 0.6 w ${MX} ${(y - 4).toFixed(2)} m ${W - MX} ${(y - 4).toFixed(2)} l S`); y -= 12; continue; }
    const e = ESTILOS[b.t] || ESTILOS.p;
    const recuo = e.recuo || 0;
    const linhas = quebrar(b.x, e.tam, e.neg, W - 2 * MX - recuo);
    const alt = e.tam * e.ent;
    y -= e.antes;
    const minimo = (e.filete || b.t === "h3" || b.t === "h1" ? 3 : 2) * alt; // não deixa título sozinho no pé da página
    if (y - Math.min(linhas.length, b.t.startsWith("h") ? 3 : 2) * alt < MB || y - minimo < MB) nova();
    const fonte = e.neg ? "F2" : e.italico ? "F3" : "F1";
    let primeira = true; const topo = y;
    for (const ln of linhas) {
      if (y - alt < MB) { nova(); }
      y -= alt;
      if (e.marca && primeira) texto(MX, y, "•", e.tam, "F1", e.cor);
      texto(MX + recuo, y, ln, e.tam, fonte, e.cor);
      primeira = false;
    }
    if (e.barra) cont.push(`0.80 0.63 0.21 RG 2 w ${MX + 3} ${(y - 3).toFixed(2)} m ${MX + 3} ${(topo - 2).toFixed(2)} l S`);
    if (e.filete) { cont.push(`0.80 0.63 0.21 RG 0.8 w ${MX} ${(y - 4).toFixed(2)} m ${W - MX} ${(y - 4).toFixed(2)} l S`); y -= 4; }
    y -= e.depois;
  }
  if (cont.length || !paginas.length) paginas.push(cont);
  // rodapé e número de página
  const total = paginas.length;
  paginas.forEach((c, i) => {
    const r = `${rodape ? rodape + "   |   " : ""}${i + 1} / ${total}`;
    c.push(`BT /F1 8.5 Tf 0.5 0.47 0.42 rg ${(W - MX - larguraTexto(r, 8.5)).toFixed(2)} 34 Td (${esc(r)}) Tj ET`);
  });
  // objetos
  const objs = []; const add = (s) => { objs.push(s); return objs.length; };
  const catalogo = add(""), arvore = add("");
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const f3 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
  const info = add(`<< /Title (${esc(titulo)}) /Producer (Biblia Avivar) >>`);
  const filhas = [];
  for (const c of paginas) {
    const fluxo = c.join("\n");
    const conteudo = add(`<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`);
    filhas.push(add(`<< /Type /Page /Parent ${arvore} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${conteudo} 0 R >>`));
  }
  objs[catalogo - 1] = `<< /Type /Catalog /Pages ${arvore} 0 R >>`;
  objs[arvore - 1] = `<< /Type /Pages /Kids [${filhas.map((k) => k + " 0 R").join(" ")}] /Count ${filhas.length} >>`;
  let pdf = "%PDF-1.4\n%âãÏÓ\n"; const pos = [];
  objs.forEach((o, i) => { pos.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + pos.map((p) => String(p).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogo} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const out = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) out[i] = pdf.charCodeAt(i) & 255;
  return out;
}

// Baixa o arquivo no navegador (funciona no celular).
export function baixarPDF(nomeArquivo, dados) {
  const blob = new Blob([gerarPDF(dados)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = /\.pdf$/i.test(nomeArquivo) ? nomeArquivo : nomeArquivo + ".pdf";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
