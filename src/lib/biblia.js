// Núcleo da Bíblia — usado pela Projeção (avivardoespirito) e pelo leitor (biblia-avivar).
// ARQUIVO IDÊNTICO nos dois projetos (src/lib/biblia.js): se mudar um, copie para o outro.
//
// O texto NÃO é digitado aqui: vem de arquivos publicados (projeto aberto thiagobodruk/biblia, via jsdelivr),
// baixados uma vez e guardados em memória. Aqui ficam só a estrutura (livros, capítulos, grupos e cores),
// a busca de palavras, a leitura de referências ("Jo 3:16-18") e a navegação versículo a versículo.

export const GRUPOS = [
  { k: "lei", r: "Lei", cor: "#C0392B" },
  { k: "hist", r: "Históricos", cor: "#D35400" },
  { k: "poet", r: "Poéticos", cor: "#1E8E5A" },
  { k: "pmai", r: "Profetas maiores", cor: "#2471A3" },
  { k: "pmen", r: "Profetas menores", cor: "#7D3C98" },
  { k: "evan", r: "Evangelhos", cor: "#B7950B" },
  { k: "atos", r: "Atos", cor: "#148F77" },
  { k: "paul", r: "Cartas de Paulo", cor: "#3F51B5" },
  { k: "ger", r: "Cartas gerais", cor: "#C2185B" },
  { k: "apoc", r: "Apocalipse", cor: "#8E3B1F" },
];
export const corDoGrupo = (k) => (GRUPOS.find((g) => g.k === k) || GRUPOS[0]).cor;

// [abbr do arquivo, nome, sigla de exibição, capítulos, grupo]
const L = [
  ["gn", "Gênesis", "Gn", 50, "lei"], ["ex", "Êxodo", "Êx", 40, "lei"], ["lv", "Levítico", "Lv", 27, "lei"],
  ["nm", "Números", "Nm", 36, "lei"], ["dt", "Deuteronômio", "Dt", 34, "lei"],
  ["js", "Josué", "Js", 24, "hist"], ["jz", "Juízes", "Jz", 21, "hist"], ["rt", "Rute", "Rt", 4, "hist"],
  ["1sm", "1 Samuel", "1Sm", 31, "hist"], ["2sm", "2 Samuel", "2Sm", 24, "hist"], ["1rs", "1 Reis", "1Rs", 22, "hist"],
  ["2rs", "2 Reis", "2Rs", 25, "hist"], ["1cr", "1 Crônicas", "1Cr", 29, "hist"], ["2cr", "2 Crônicas", "2Cr", 36, "hist"],
  ["ed", "Esdras", "Ed", 10, "hist"], ["ne", "Neemias", "Ne", 13, "hist"], ["et", "Ester", "Et", 10, "hist"],
  ["job", "Jó", "Jó", 42, "poet"], ["sl", "Salmos", "Sl", 150, "poet"], ["pv", "Provérbios", "Pv", 31, "poet"],
  ["ec", "Eclesiastes", "Ec", 12, "poet"], ["ct", "Cantares de Salomão", "Ct", 8, "poet"],
  ["is", "Isaías", "Is", 66, "pmai"], ["jr", "Jeremias", "Jr", 52, "pmai"], ["lm", "Lamentações", "Lm", 5, "pmai"],
  ["ez", "Ezequiel", "Ez", 48, "pmai"], ["dn", "Daniel", "Dn", 12, "pmai"],
  ["os", "Oséias", "Os", 14, "pmen"], ["jl", "Joel", "Jl", 3, "pmen"], ["am", "Amós", "Am", 9, "pmen"],
  ["ob", "Obadias", "Ob", 1, "pmen"], ["jn", "Jonas", "Jn", 4, "pmen"], ["mq", "Miquéias", "Mq", 7, "pmen"],
  ["na", "Naum", "Na", 3, "pmen"], ["hc", "Habacuque", "Hc", 3, "pmen"], ["sf", "Sofonias", "Sf", 3, "pmen"],
  ["ag", "Ageu", "Ag", 2, "pmen"], ["zc", "Zacarias", "Zc", 14, "pmen"], ["ml", "Malaquias", "Ml", 4, "pmen"],
  ["mt", "Mateus", "Mt", 28, "evan"], ["mc", "Marcos", "Mc", 16, "evan"], ["lc", "Lucas", "Lc", 24, "evan"],
  ["jo", "João", "Jo", 21, "evan"], ["at", "Atos", "At", 28, "atos"],
  ["rm", "Romanos", "Rm", 16, "paul"], ["1co", "1 Coríntios", "1Co", 16, "paul"], ["2co", "2 Coríntios", "2Co", 13, "paul"],
  ["gl", "Gálatas", "Gl", 6, "paul"], ["ef", "Efésios", "Ef", 6, "paul"], ["fp", "Filipenses", "Fp", 4, "paul"],
  ["cl", "Colossenses", "Cl", 4, "paul"], ["1ts", "1 Tessalonicenses", "1Ts", 5, "paul"], ["2ts", "2 Tessalonicenses", "2Ts", 3, "paul"],
  ["1tm", "1 Timóteo", "1Tm", 6, "paul"], ["2tm", "2 Timóteo", "2Tm", 4, "paul"], ["tt", "Tito", "Tt", 3, "paul"],
  ["fm", "Filemom", "Fm", 1, "paul"],
  ["hb", "Hebreus", "Hb", 13, "ger"], ["tg", "Tiago", "Tg", 5, "ger"], ["1pe", "1 Pedro", "1Pe", 5, "ger"],
  ["2pe", "2 Pedro", "2Pe", 3, "ger"], ["1jo", "1 João", "1Jo", 5, "ger"], ["2jo", "2 João", "2Jo", 1, "ger"],
  ["3jo", "3 João", "3Jo", 1, "ger"], ["jd", "Judas", "Jd", 1, "ger"],
  ["ap", "Apocalipse", "Ap", 22, "apoc"],
];
export const LIVROS = L.map(([abbr, nome, sigla, caps, grupo], i) => ({ abbr, nome, sigla, caps, grupo, cor: corDoGrupo(grupo), ordem: i, at: i < 39 }));
export const achaLivro = (abbr) => LIVROS.find((b) => b.abbr === abbr) || null;

// "carta de …", "livro de …" para o cabeçalho do leitor
const GENERO = {
  lei: "livro da Lei", hist: "livro histórico", poet: "livro poético", pmai: "livro dos profetas maiores", pmen: "livro dos profetas menores",
  evan: "Evangelho", atos: "livro de Atos", paul: "carta do apóstolo Paulo", ger: "carta geral", apoc: "livro profético",
};
export const generoDoLivro = (b) => (b ? GENERO[b.grupo] : "");

// "Evangelho de João", "1ª carta de Paulo aos Coríntios", "livro do profeta Isaías"… (para o cabeçalho do leitor)
const ORD = { 1: "1ª", 2: "2ª", 3: "3ª" };
export function descreverLivro(b) {
  if (!b) return "";
  const m = b.nome.match(/^([1-3])\s+(.*)$/);
  const num = m ? ORD[m[1]] + " " : "";
  const nome = m ? m[2] : b.nome;
  switch (b.grupo) {
    case "evan": return `Evangelho de ${b.nome}`;
    case "atos": return "livro de Atos dos Apóstolos";
    case "apoc": return "livro do Apocalipse";
    case "pmai": case "pmen": return b.abbr === "lm" ? "livro de Lamentações" : `livro do profeta ${b.nome}`;
    case "paul": return ["1tm", "2tm", "tt", "fm"].includes(b.abbr) ? `${num}carta de Paulo a ${nome}` : `${num}carta de Paulo aos ${nome}`;
    case "ger":
      if (b.abbr === "hb") return "carta aos Hebreus";
      return `${num}carta de ${nome}`;
    default: return b.abbr === "sl" ? "livro dos Salmos" : `livro de ${b.nome}`;
  }
}
// "Você está entre os versículos 16 ao 18, capítulo 3, Evangelho de João, Novo Testamento."
export function cabecalhoLeitura(abbr, c, v1, v2) {
  const b = achaLivro(abbr); if (!b) return "";
  const onde = v1 ? (v2 && v2 > v1 ? `entre os versículos ${v1} ao ${v2}` : `no versículo ${v1}`) : "no capítulo " + c;
  const cap = v1 ? `, capítulo ${c}` : "";
  return `Você está ${onde}${cap}, ${descreverLivro(b)}, ${b.at ? "Antigo" : "Novo"} Testamento.`;
}

/* ------------------------------ traduções ------------------------------ */
// Cada tradução é um arquivo no formato [{abbrev, chapters:[[versículo,...],...]}, ...].
// `licenca` é só um lembrete para o administrador (a conferência jurídica é sua, antes de lançar o app).
const BASE = "https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/";
export const TRADUCOES = [
  { id: "nvi", sigla: "NVI", nome: "Nova Versão Internacional", idioma: "pt", url: BASE + "nvi.json", licenca: "Texto protegido (Biblica/Sociedade Bíblica Internacional). Confirmar permissão antes de lançar como app independente." },
  { id: "acf", sigla: "ACF", nome: "Almeida Corrigida Fiel", idioma: "pt", url: BASE + "acf.json", licenca: "Tradução tradicional de Almeida; conferir a edição/licença exata antes de lançar como app independente." },
  { id: "aa", sigla: "ARA", nome: "Almeida Revista e Atualizada", idioma: "pt", url: BASE + "aa.json", licenca: "Texto protegido (Sociedade Bíblica do Brasil). Confirmar permissão antes de lançar." },
];
export const traducaoDe = (id) => TRADUCOES.find((t) => t.id === id) || TRADUCOES[0];

const cache = new Map(); // id -> { dados, promessa, indice }
export function biblia(trId) { const c = cache.get(trId); return c && c.dados ? c.dados : null; }
export function carregarBiblia(trId = "nvi", buscar = (typeof fetch === "function" ? fetch : null)) {
  const tr = traducaoDe(trId);
  let c = cache.get(tr.id);
  if (c && c.dados) return Promise.resolve(c.dados);
  if (c && c.promessa) return c.promessa;
  c = c || {};
  c.promessa = Promise.resolve()
    .then(() => buscar(tr.url))
    .then((r) => { if (!r.ok) throw new Error("Não consegui baixar a tradução " + tr.sigla); return r.json(); })
    .then((d) => { c.dados = Array.isArray(d) ? d : []; c.promessa = null; return c.dados; })
    .catch((e) => { c.promessa = null; throw e; });
  cache.set(tr.id, c);
  return c.promessa;
}
export function _injetarBiblia(trId, dados) { cache.set(trId, { dados }); } // testes

export function capitulo(trId, abbr, cap) {
  const d = biblia(trId); if (!d) return null;
  const l = d.find((b) => b.abbrev === abbr); const arr = l && l.chapters[cap - 1];
  return arr ? arr.map((t, i) => ({ n: i + 1, t: String(t) })) : null;
}
export function limparTexto(t) { return String(t || "").replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim(); }

/* ------------------------------ busca de palavras ------------------------------ */
export const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function buscarPalavras(trId, consulta, { max = 200, livro = null } = {}) {
  const d = biblia(trId); if (!d) return null;
  const c = cache.get(traducaoDe(trId).id);
  if (!c.indice) c.indice = d.map((l) => l.chapters.map((cap) => cap.map((t) => semAcento(limparTexto(t)))));
  const termos = semAcento(consulta).split(/[^a-z0-9]+/).filter((x) => x.length >= 2);
  if (!termos.length) return [];
  const frase = semAcento(consulta).replace(/\s+/g, " ").trim();
  const usarFrase = termos.length > 1 && /^".+"$/.test(String(consulta).trim());
  const out = [];
  for (let b = 0; b < d.length && out.length < max; b++) {
    const abbr = d[b].abbrev; if (livro && abbr !== livro) continue;
    const idx = c.indice[b];
    for (let ci = 0; ci < idx.length && out.length < max; ci++) {
      for (let v = 0; v < idx[ci].length && out.length < max; v++) {
        const t = idx[ci][v];
        const ok = usarFrase ? t.includes(frase.replace(/"/g, "")) : termos.every((x) => t.includes(x));
        if (ok) out.push({ abbr, c: ci + 1, v: v + 1, t: limparTexto(d[b].chapters[ci][v]) });
      }
    }
  }
  return out;
}

/* ------------------------------ referências ------------------------------ */
export function achaLivroPorTexto(txt) {
  const com = String(txt || "").toLowerCase().replace(/[.\s]/g, ""); // mantém acentos: "jó" é Jó, "jo" é João
  const q = semAcento(com);
  if (!q) return null;
  const exato = (com !== q && LIVROS.find((b) => b.sigla.toLowerCase() === com)) || LIVROS.find((b) => b.abbr === q) || LIVROS.find((b) => b.sigla.toLowerCase() === com)
    || LIVROS.find((b) => semAcento(b.nome).replace(/\s/g, "") === q) || LIVROS.find((b) => semAcento(b.sigla) === q);
  if (exato) return exato;
  if (q.length < 2) return null;
  const cand = LIVROS.filter((b) => semAcento(b.nome).replace(/\s/g, "").startsWith(q));
  return cand.length === 1 ? cand[0] : null;
}
// "Jo 3:16", "joão 3 16-18", "1 co 13", "sl 23"
export function lerReferencia(txt) {
  const m = String(txt || "").trim().match(/^([1-3]?\s*[A-Za-zÀ-ÿ]+\.?)\s*(\d{1,3})?(?:\s*[:.,\s]\s*(\d{1,3})(?:\s*[-–a]\s*(\d{1,3}))?)?\s*$/);
  if (!m) return null;
  const b = achaLivroPorTexto(m[1]); if (!b) return null;
  const cap = m[2] ? Math.min(Number(m[2]), b.caps) : null;
  if (m[2] && Number(m[2]) > b.caps) return null;
  const v1 = m[3] ? Number(m[3]) : null; const v2 = m[4] ? Number(m[4]) : null;
  return { abbr: b.abbr, c: cap, v1, v2: v2 && v1 && v2 >= v1 ? v2 : v1 };
}
export function textoReferencia(abbr, c, v1, v2) {
  const b = achaLivro(abbr); const nome = b ? b.nome : abbr;
  return `${nome} ${c}${v1 ? ":" + v1 + (v2 && v2 !== v1 ? "–" + v2 : "") : ""}`;
}

// Ir ao versículo X ou do X ao Y (digitado ou falado): "16", "16 a 18", "16-18", "dezesseis" (palavras simples)
const NUMEROS = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100 };
function numeroPorExtenso(palavras) {
  let t = 0, achou = false;
  for (const p of palavras) { if (p === "e") continue; if (NUMEROS[p] != null) { t += NUMEROS[p]; achou = true; } else return null; }
  return achou ? t : null;
}
export function lerVersiculos(txt, max = 200) {
  const s = semAcento(txt).replace(/\bversiculos?\b|\b(do|de|no|o)\b/g, " ").replace(/\b(ao|ate|a)\b/g, " - ");
  const partes = s.split(/\s*[-–]\s*/).map((x) => x.trim()).filter(Boolean);
  const num = (x) => { const d = x.match(/\d+/); if (d) return Number(d[0]); return numeroPorExtenso(x.split(/\s+/)); };
  const a = partes[0] ? num(partes[0]) : null; if (!a || a < 1) return null;
  let b = partes[1] ? num(partes[1]) : a; if (!b || b < a) b = a;
  return { v1: Math.min(a, max), v2: Math.min(b, max) };
}

/* ------------------------------ navegação (projeção) ------------------------------ */
// bb = { tr, abbr, c, v1, v2 } descreve o(s) versículo(s) no ar. Devolve o próximo (d=1) ou anterior (d=-1), passando
// de capítulo e de livro quando preciso. g = quantos versículos por tela.
export function passo(bb, d, g = 1) {
  const ch = capitulo(bb.tr, bb.abbr, bb.c); if (!ch) return null;
  let abbr = bb.abbr, c = bb.c, ini;
  if (d > 0) ini = bb.v2 + 1; else ini = bb.v1 - g;
  if (d > 0 && ini > ch.length) {
    const b = achaLivro(abbr);
    if (c < b.caps) c += 1; else { const nx = LIVROS[b.ordem + 1]; if (!nx) return null; abbr = nx.abbr; c = 1; }
    ini = 1;
  } else if (d < 0 && bb.v1 <= 1) {
    const b = achaLivro(abbr);
    if (c > 1) c -= 1; else { const pv = LIVROS[b.ordem - 1]; if (!pv) return null; abbr = pv.abbr; c = pv.caps; }
    const t = capitulo(bb.tr, abbr, c); if (!t) return null;
    ini = Math.max(1, t.length - g + 1);
  }
  return monta({ tr: bb.tr, abbr, c, v1: Math.max(1, ini) }, g);
}
// monta o objeto completo (com o texto) a partir de {tr,abbr,c,v1,v2?}
export function monta(bb, g = 1) {
  const ch = capitulo(bb.tr, bb.abbr, bb.c); if (!ch) return null;
  const v1 = Math.min(Math.max(1, bb.v1), ch.length);
  const v2 = Math.min(bb.v2 ? Math.max(bb.v2, v1) : v1 + g - 1, ch.length);
  const vs = ch.filter((x) => x.n >= v1 && x.n <= v2).map((x) => ({ n: x.n, t: limparTexto(x.t) }));
  return { tr: bb.tr, abbr: bb.abbr, c: bb.c, v1, v2, ref: textoReferencia(bb.abbr, bb.c, v1, v2), vs, total: ch.length };
}
