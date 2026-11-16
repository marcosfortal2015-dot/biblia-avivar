// Ferramentas dos hinos: corrigir acentos e grafia, separar em estrofes e entender o formato "Título - número".
// Nada aqui traz letra de música: tudo trabalha só com o texto que a pessoa cola ou cadastra no próprio app.

/* ---------------- corrigir acentuação e grafia ---------------- */
// Só entram palavras que, SEM o acento, não são outra palavra de uso comum (por isso "esta", "so", "ate", "ira" ficam de fora).
const CORRECOES = {
  nao: "não", refrao: "refrão", sao: "são", entao: "então", tambem: "também", alem: "além", porem: "porém", ninguem: "ninguém", alguem: "alguém",
  voce: "você", voces: "vocês", ja: "já", ha: "há", amanha: "amanhã", amem: "amém", gracas: "graças",
  ceu: "céu", refrao: "refrão", ceus: "céus", mao: "mão", maos: "mãos", irmao: "irmão", irmaos: "irmãos", pao: "pão", paes: "pães",
  coracao: "coração", coracoes: "corações", cancao: "canção", cancoes: "canções", salvacao: "salvação", oracao: "oração", oracoes: "orações",
  uniao: "união", nacao: "nação", nacoes: "nações", perdao: "perdão", razao: "razão", paixao: "paixão", redencao: "redenção",
  criacao: "criação", adoracao: "adoração", ressurreicao: "ressurreição", exaltacao: "exaltação", bencao: "bênção", bencaos: "bênçãos",
  gloria: "glória", glorias: "glórias", historia: "história", vitoria: "vitória", memoria: "memória", misericordia: "misericórdia",
  espirito: "espírito", santissimo: "santíssimo", altissimo: "Altíssimo", proximo: "próximo", unico: "único", unica: "única", ultimo: "último",
  esperanca: "esperança", confianca: "confiança", alianca: "aliança", lembranca: "lembrança", forca: "força", presenca: "presença",
  inocencia: "inocência", jerusalem: "Jerusalém", belem: "Belém", sera: "será", serao: "serão", estao: "estão", tera: "terá", terao: "terão",
  dara: "dará", ficara: "ficará", verao: "verão", podera: "poderá", levara: "levará", reinara: "reinará", regera: "regerá",
  descera: "descerá", voltara: "voltará", ressurgira: "ressurgirá", fara: "fará", sabera: "saberá", cantarao: "cantarão",
};
const casar = (orig, novo) => {
  if (orig.length > 1 && orig === orig.toUpperCase()) return novo.toUpperCase();
  if (orig[0] === orig[0].toUpperCase() && orig[0] !== orig[0].toLowerCase()) return novo[0].toUpperCase() + novo.slice(1);
  return novo.toLowerCase() === novo ? novo : novo.toLowerCase();
};

// Devolve o texto corrigido e a lista do que mudou ([{ de, para, n }]).
export function corrigirGrafia(texto) {
  const mudou = new Map();
  const reg = (de, para) => { const k = de + "→" + para; mudou.set(k, { de, para, n: (mudou.get(k) ? mudou.get(k).n : 0) + 1 }); };
  let t = String(texto || "").replace(/\r\n?/g, "\n");
  t = t.replace(/[A-Za-zÀ-ÿ]+/g, (w) => {
    const novo = CORRECOES[w.toLowerCase()];
    if (!novo) return w;
    const certo = casar(w, novo);
    if (certo !== w) reg(w, certo);
    return certo;
  });
  const passos = [
    [/[ \t]+$/gm, "", "espaço no fim da linha"],
    [/[ \t]{2,}/g, " ", "espaços repetidos"],
    [/ +([,;:.!?])/g, "$1", "espaço antes da pontuação"],
    [/([,;:!?])(?=[A-Za-zÀ-ÿ])/g, "$1 ", "falta espaço depois da pontuação"],
  ];
  passos.forEach(([re, sub, nome]) => {
    const antes = t;
    t = t.replace(re, sub);
    if (t !== antes) { const k = "·" + nome; mudou.set(k, { de: nome, para: "arrumado", n: (antes.match(re) || []).length }); }
  });
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return { texto: t, mudancas: [...mudou.values()].sort((a, b) => b.n - a.n) };
}

/* ---------------- separar em estrofes ---------------- */
const ehCredito = (l) => /^\s*(composi[cç][aã]o|letra|m[uú]sica|autor|tradu[cç][aã]o|versão|vers[aã]o)\s*[:\-–]/i.test(l);
const norm = (b) => b.join("\n").toLowerCase().replace(/[^a-zà-ÿ0-9\n]/gi, "");

// Estrofes separadas por linha em branco; sem linha em branco, agrupa de 4 em 4 linhas.
// Blocos idênticos que se repetem viram "Refrão". A linha "Composição: …" vira o crédito.
export function dividirEstrofes(letra) {
  const linhas = String(letra || "").replace(/\r\n?/g, "\n").split("\n");
  let credito = null;
  const corpo = [];
  linhas.forEach((l) => { if (ehCredito(l)) credito = (credito ? credito + " · " : "") + l.trim(); else corpo.push(l); });
  const texto = corpo.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!texto) return { estrofes: [], credito };
  let blocos = texto.split(/\n\s*\n/).map((b) => b.split("\n").map((x) => x.trim()).filter(Boolean)).filter((b) => b.length);
  if (blocos.length === 1 && blocos[0].length > 5) {
    const todas = blocos[0];
    blocos = [];
    for (let i = 0; i < todas.length; i += 4) blocos.push(todas.slice(i, i + 4));
    if (blocos.length > 1 && blocos[blocos.length - 1].length === 1) { const u = blocos.pop(); blocos[blocos.length - 1].push(...u); }
  }
  const cont = new Map();
  blocos.forEach((b) => { const k = norm(b); cont.set(k, (cont.get(k) || 0) + 1); });
  const estrofes = blocos.map((linhas2) => ({ linhas: linhas2, refrao: linhas2.length > 1 && (cont.get(norm(linhas2)) || 0) >= 2 }));
  return { estrofes, credito };
}

/* ---------------- formato "Título - número" ---------------- */
// Aceita blocos assim:  "Título do hino - 123"  na linha de cima e o texto embaixo, hino após hino.
// Também separa quando o título do hino seguinte vem na mesma linha do crédito (muitos espaços entre eles).
export function lerTituloNumero(txt) {
  const bruto = String(txt || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const linhas = [];
  bruto.forEach((l) => {
    const m = l.match(/^(.*?\S)\s{3,}(\S.{0,80}?\s*[-–—]\s*\d{1,3})\s*$/);
    if (m && /\S/.test(m[1])) { linhas.push(m[1]); linhas.push(m[2]); } else linhas.push(l);
  });
  const cab = /^\s*(\S.{0,80}?)\s*[-–—]\s*(\d{1,3})\s*$/;
  const out = [];
  let cur = null;
  linhas.forEach((l) => {
    const m = l.match(cab);
    if (m && !ehCredito(l) && !/[.,;:!?]$/.test(m[1].trim())) {
      if (cur) out.push(cur);
      cur = { numero: Number(m[2]), titulo: m[1].trim(), letra: "" };
    } else if (cur) cur.letra += l.replace(/\s+$/, "") + "\n";
  });
  if (cur) out.push(cur);
  return out.map((h) => ({ ...h, letra: h.letra.replace(/\n{3,}/g, "\n\n").trim() })).filter((h) => h.numero && h.titulo && h.letra);
}
