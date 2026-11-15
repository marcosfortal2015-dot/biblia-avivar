// Peças do novo leitor da Bíblia: grade de capítulos coloridos, "ir ao versículo" (digitado ou falado),
// cabeçalho "você está entre os versículos…", palavras difíceis (balão + página de imersão) e interpretação por IA.
import React, { useState, useEffect, useRef } from "react";
import { X, Mic, Volume2, Sparkles, ArrowLeft, BookOpen, Search, Loader2, Globe, ChevronRight, Clock } from "lucide-react";
import * as BIB from "./lib/biblia.js";
import { segmentarPalavras } from "./lib/palavras.js";
import { iaLigada, iaPedir, MOTIVOS_IA } from "./lib/ia.js";
import { t, useIdioma, IDIOMAS, setIdioma, idioma } from "./lib/i18n.js";

const C = { ink: "#1F1B2E", parchment: "#FBF6ED", cream: "#FFFDF8", gold: "#CBA135", goldBright: "#E9C765", goldDeep: "#8B6F1F", stone: "#8A8272", line: "#00000018", violet: "#4B3B77" };

/* ------------------------- nomes e descrições dos livros (por idioma) ------------------------- */
export const nomeLivro = (b) => t("livro." + b.abbr, b.nome || b.name);
export function descLivro(b) {
  const m = b.nome.match(/^([1-3])\s+(.*)$/);
  const o = m ? t("ord." + m[1], ({ 1: "1ª ", 2: "2ª ", 3: "3ª " })[m[1]]) : "";
  const n = t("livro." + b.abbr, m ? m[2] : b.nome).replace(/^[1-3]\s+/, "");
  const nCompleto = nomeLivro(b);
  switch (b.grupo) {
    case "evan": return t("desc.evan", "Evangelho de {n}", { n: nCompleto });
    case "atos": return t("desc.atos", "livro de Atos dos Apóstolos");
    case "apoc": return t("desc.apoc", "livro do Apocalipse");
    case "pmai": case "pmen": return b.abbr === "lm" ? t("desc.lm", "livro de Lamentações") : t("desc.profeta", "livro do profeta {n}", { n: nCompleto });
    case "paul": return ["1tm", "2tm", "tt", "fm"].includes(b.abbr) ? t("desc.paulPessoa", "{o}carta de Paulo a {n}", { o, n }) : t("desc.paulIgreja", "{o}carta de Paulo aos {n}", { o, n });
    case "ger": return b.abbr === "hb" ? t("desc.hb", "carta aos Hebreus") : t("desc.ger", "{o}carta de {n}", { o, n });
    default: return b.abbr === "sl" ? t("desc.sl", "livro dos Salmos") : t("desc.livro", "livro de {n}", { n: nCompleto });
  }
}
export function textoCabecalho(abbr, c, v1, v2) {
  const b = BIB.achaLivro(abbr); if (!b) return "";
  const vars = { c, v1, v2, livro: descLivro(b), tes: b.at ? t("tes.at", "Antigo Testamento") : t("tes.nt", "Novo Testamento") };
  if (v1 && v2 && v2 > v1) return t("cab.faixa", "Você está entre os versículos {v1} ao {v2}, capítulo {c}, {livro}, {tes}.", vars);
  if (v1) return t("cab.um", "Você está no versículo {v1}, capítulo {c}, {livro}, {tes}.", vars);
  return t("cab.cap", "Você está no capítulo {c}, {livro}, {tes}.", vars);
}

/* ------------------------- voz: falar e ouvir ------------------------- */
export function falar(texto, { rate = 1, lang = "pt-BR" } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = lang; u.rate = rate;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
export function ouvir(aoTexto, aoErro, lang = "pt-BR") {
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) { aoErro(t("voz.semSuporte", "Este navegador não entende voz. Digite o número.")); return null; }
  const r = new SR(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = (ev) => { try { aoTexto(ev.results[0][0].transcript); } catch (e) { aoErro(t("voz.naoEntendi", "Não entendi. Tente de novo.")); } };
  r.onerror = () => aoErro(t("voz.erro", "Não consegui ouvir. Tente de novo ou digite."));
  try { r.start(); } catch (e) { aoErro(t("voz.microfone", "Não consegui ligar o microfone.")); return null; }
  return r;
}

/* ------------------------- seletores ------------------------- */
export function SeletorIdioma() {
  const [lang] = useIdioma();
  return (
    <label className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.gold }} title={t("idioma.titulo", "Idioma")}>
      <Globe size={15} />
      <select value={lang} onChange={(e) => setIdioma(e.target.value)} aria-label={t("idioma.titulo", "Idioma")} data-testid="seletor-idioma" className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer" style={{ color: C.goldBright }}>
        {IDIOMAS.map((i) => <option key={i.id} value={i.id} style={{ color: "#000" }}>{i.curto}</option>)}
      </select>
    </label>
  );
}
export function SeletorTraducao({ valor, aoMudar }) {
  useIdioma();
  return (
    <label className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.stone }}>
      {t("trad.rotulo", "Tradução:")}
      <select value={valor} onChange={(e) => aoMudar(e.target.value)} data-testid="seletor-traducao" aria-label={t("trad.rotulo", "Tradução:")} className="rounded-md border px-2 py-1 text-xs bg-white" style={{ borderColor: C.line, color: C.ink }}>
        {BIB.TRADUCOES.map((x) => <option key={x.id} value={x.id}>{x.sigla} · {x.nome}</option>)}
      </select>
    </label>
  );
}

/* ------------------------- escolha do capítulo ------------------------- */
export function GradeCapitulos({ book, aoEscolher, aoIrReferencia, ultimo }) {
  useIdioma();
  const lv = BIB.achaLivro(book.abbr);
  const cor = lv ? lv.cor : C.gold;
  const [atalho, setAtalho] = useState("");
  const [aviso, setAviso] = useState("");
  const ir = () => {
    const r = BIB.lerReferencia(`${lv.sigla} ${atalho}`.replace(/\s+/g, " "));
    if (!r || !r.c) { setAviso(t("grade.atalhoInvalido", "Não entendi. Exemplos: 3 · 3:16 · 3:16-18")); return; }
    aoIrReferencia(r.c, r.v1, r.v2);
  };
  return (
    <div data-testid="grade-capitulos">
      <p className="text-sm mb-1 font-semibold" style={{ color: C.ink }}>{t("grade.titulo", "Escolha o capítulo")}</p>
      <p className="text-xs mb-3" style={{ color: C.stone }}>{t("grade.sub", "{n} capítulos em {livro}. Toque em um número para ler.", { n: book.chapters, livro: nomeLivro(book) })}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(56px,1fr))" }}>
        {Array.from({ length: book.chapters }, (_, k) => k + 1).map((n) => (
          <button key={n} onClick={() => aoEscolher(n)} data-testid={"cap-" + n} aria-label={t("grade.cap", "Capítulo {n}", { n })}
            className="rounded-xl min-h-[52px] text-lg font-extrabold text-white focus:outline-none focus:ring-2 transition hover:-translate-y-0.5"
            style={{ background: cor, boxShadow: ultimo === n ? `0 0 0 3px ${C.cream}, 0 0 0 5px ${C.gold}` : "0 1px 2px #0003" }}>{n}</button>
        ))}
      </div>
      <div className="mt-5 rounded-xl p-3 flex flex-wrap items-center gap-2" style={{ background: C.parchment, border: `1px solid ${C.gold}44` }}>
        <Search size={15} color={C.goldDeep} />
        <span className="text-xs font-semibold" style={{ color: C.goldDeep }}>{t("grade.atalho", "Ir direto:")}</span>
        <input value={atalho} onChange={(e) => { setAtalho(e.target.value); setAviso(""); }} onKeyDown={(e) => { if (e.key === "Enter") ir(); }} placeholder={t("grade.atalhoDica", "capítulo e versículo, ex.: 3:16")} aria-label={t("grade.atalho", "Ir direto:")} data-testid="grade-atalho" className="flex-1 min-w-[160px] rounded-md border px-2.5 py-1.5 text-sm bg-white" style={{ borderColor: C.line }} />
        <button onClick={ir} className="rounded-md px-3 py-1.5 text-xs font-bold" style={{ background: C.gold, color: "#fff" }} data-testid="grade-atalho-ir">{t("ir", "Ir")}</button>
        {aviso && <p className="w-full text-xs" style={{ color: "#B03428" }}>{aviso}</p>}
      </div>
    </div>
  );
}

/* ------------------------- ir ao versículo X (ou X ao Y), digitado ou falado ------------------------- */
export function BarraIrVersiculo({ total, aoIr, ativa, aoLimpar, abrirAgora }) {
  useIdioma();
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState("");
  const [aviso, setAviso] = useState("");
  const [ouvindo, setOuvindo] = useState(false);
  useEffect(() => { if (abrirAgora) setAberto(true); }, [abrirAgora]);
  const enviar = (valor) => {
    const v = BIB.lerVersiculos(valor);
    if (!v) { setAviso(t("ir.invalido", "Não entendi. Exemplos: 16 · 16 a 18 · do 5 ao 9")); return; }
    if (v.v1 > total) { setAviso(t("ir.excede", "Este capítulo só tem {n} versículos.", { n: total })); return; }
    setAviso(""); aoIr(v.v1, Math.min(v.v2, total));
  };
  const falarNum = () => { setAviso(""); setOuvindo(true); const r = ouvir((x) => { setOuvindo(false); setTxt(x); enviar(x); }, (m) => { setOuvindo(false); setAviso(m); }, idioma() === "pt" ? "pt-BR" : idioma() === "es" ? "es-ES" : "en-US"); if (!r) setOuvindo(false); };
  return (
    <div className="rounded-xl p-2.5 mb-3" style={{ background: C.parchment, border: `1px solid ${C.gold}44` }} data-testid="barra-versiculo">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setAberto((a) => !a)} aria-expanded={aberto} data-testid="btn-ir-versiculo" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2" style={{ background: C.gold, color: "#fff" }}>
          <ChevronRight size={15} /> {t("ir.botao", "Ir ao versículo")}
        </button>
        {ativa && <button onClick={aoLimpar} data-testid="btn-capitulo-inteiro" className="rounded-full px-3 py-2 text-xs font-semibold border" style={{ borderColor: C.gold + "66", color: C.goldDeep }}>{t("ir.capInteiro", "Ver o capítulo inteiro")}</button>}
      </div>
      {aberto && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <input autoFocus value={txt} onChange={(e) => { setTxt(e.target.value); setAviso(""); }} onKeyDown={(e) => { if (e.key === "Enter") enviar(txt); }} placeholder={t("ir.dica", "Versículo: 16 ou 16 a 18")} aria-label={t("ir.botao", "Ir ao versículo")} data-testid="campo-versiculo" className="flex-1 min-w-[170px] rounded-md border px-3 py-2 text-sm bg-white" style={{ borderColor: C.line }} />
          <button onClick={() => enviar(txt)} data-testid="btn-ir-confirmar" className="rounded-md px-4 py-2 text-sm font-bold" style={{ background: C.ink, color: C.goldBright }}>{t("ir", "Ir")}</button>
          <button onClick={falarNum} aria-label={t("ir.falar", "Falar o número do versículo")} data-testid="btn-voz-versiculo" className="rounded-md px-3 py-2 border inline-flex items-center gap-1.5 text-sm" style={{ borderColor: C.gold + "88", color: C.goldDeep, background: ouvindo ? C.goldBright + "55" : "#fff" }}>
            <Mic size={15} /> {ouvindo ? t("ir.ouvindo", "Ouvindo…") : t("ir.falar", "Falar o número do versículo")}
          </button>
          {aviso && <p className="w-full text-xs" style={{ color: "#B03428" }} data-testid="aviso-versiculo">{aviso}</p>}
        </div>
      )}
    </div>
  );
}

export function CabecalhoLeitura({ abbr, c, v1, v2, total }) {
  useIdioma();
  const lv = BIB.achaLivro(abbr);
  return (
    <p className="rounded-lg px-3.5 py-2.5 mb-3 text-sm leading-snug" data-testid="cabecalho-leitura" style={{ background: "#fff", borderLeft: `5px solid ${lv ? lv.cor : C.gold}`, color: C.ink, boxShadow: "0 1px 3px #0001" }}>
      {textoCabecalho(abbr, c, v1, v2)}{!v1 && total ? <span style={{ color: C.stone }}> {t("cab.total", "({n} versículos)", { n: total })}</span> : null}
    </p>
  );
}

/* ------------------------- palavras difíceis ------------------------- */
// Troca as palavras do glossário por botões sublinhados. `chave` evita chaves repetidas no React.
export function TextoComPalavras({ texto, chave = "", aoPalavra, ativo = true }) {
  if (!ativo) return <>{texto}</>;
  const partes = segmentarPalavras(texto);
  return (
    <>
      {partes.map((p, i) => p.p ? (
        <span key={chave + i} role="button" tabIndex={0} data-testid="palavra-dificil" data-palavra={p.p.id}
          onClick={(e) => { e.stopPropagation(); aoPalavra(p.p, e.currentTarget.getBoundingClientRect()); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); aoPalavra(p.p, e.currentTarget.getBoundingClientRect()); } }}
          style={{ borderBottom: `2px dotted ${C.goldDeep}`, cursor: "help", background: "#CBA13522", borderRadius: 3, padding: "0 1px" }}>{p.t}</span>
      ) : <React.Fragment key={chave + i}>{p.t}</React.Fragment>)}
    </>
  );
}

export function PalavraBalao({ palavra, ancora, aoFechar, aoImersao }) {
  useIdioma();
  const [vw, vh] = [typeof window !== "undefined" ? window.innerWidth : 800, typeof window !== "undefined" ? window.innerHeight : 600];
  // celular: folha presa embaixo da tela (sempre cabe); computador: balão junto da palavra, onde houver mais espaço
  const folha = vw < 560 || !ancora;
  const largura = folha ? Math.min(vw, 560) : Math.min(350, vw - 24);
  const cx = ancora ? ancora.left + ancora.width / 2 : vw / 2;
  const left = folha ? Math.max(0, (vw - largura) / 2) : Math.max(12, Math.min(cx - largura / 2, vw - largura - 12));
  const abaixoLivre = ancora ? vh - ancora.bottom - 16 : vh;
  const acimaLivre = ancora ? ancora.top - 16 : 0;
  const embaixo = abaixoLivre >= Math.min(340, acimaLivre) || abaixoLivre >= acimaLivre;
  const pos = folha ? { bottom: 0, maxHeight: Math.round(vh * 0.78), borderRadius: "20px 20px 0 0" }
    : embaixo ? { top: ancora.bottom + 10, maxHeight: Math.min(430, abaixoLivre) } : { bottom: vh - ancora.top + 10, maxHeight: Math.min(430, acimaLivre) };
  useEffect(() => { const k = (e) => { if (e.key === "Escape") aoFechar(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const [falou, setFalou] = useState("");
  const dizer = (devagar) => { const ok = falar(palavra.termo, { rate: devagar ? 0.55 : 0.9 }); setFalou(ok ? "" : t("falar.semSuporte", "Este aparelho não consegue falar em voz alta.")); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70 }} onClick={aoFechar} data-testid="fundo-balao">
      <div role="dialog" aria-label={palavra.termo} data-testid="balao-palavra" onClick={(e) => e.stopPropagation()}
        className="rounded-2xl p-4 shadow-2xl" style={{ position: "fixed", ...pos, left, width: largura, background: "#fff", border: `2px solid ${C.gold}`, overflowY: "auto" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-xl font-bold leading-tight" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }} data-testid="balao-termo">{palavra.termo}</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5" style={{ background: C.gold + "33", color: C.goldDeep }}>{palavra.tipo}</span>
          </div>
          <button onClick={aoFechar} aria-label={t("fechar", "Fechar")} className="p-1.5 rounded-full" style={{ color: C.stone }} data-testid="balao-fechar"><X size={18} /></button>
        </div>
        <div className="mt-3 rounded-xl p-2.5" style={{ background: C.parchment }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.goldDeep }}>{t("palavra.comoLer", "Como ler")}</p>
          <p className="text-2xl font-extrabold tracking-wide mt-0.5" style={{ color: C.violet }} data-testid="balao-silabas">{palavra.silabas}</p>
          <p className="text-[11px]" style={{ color: C.stone }}>{t("palavra.dicaSilaba", "A parte em MAIÚSCULAS é a sílaba mais forte.")}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => dizer(false)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: C.ink, color: C.goldBright }} data-testid="balao-ouvir"><Volume2 size={14} /> {t("palavra.ouvir", "Ouvir")}</button>
            <button onClick={() => dizer(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border" style={{ borderColor: C.gold, color: C.goldDeep }} data-testid="balao-devagar"><Clock size={14} /> {t("palavra.devagar", "Devagar")}</button>
          </div>
          {falou && <p className="text-[11px] mt-1" style={{ color: "#B03428" }}>{falou}</p>}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider mt-3" style={{ color: C.goldDeep }}>{t("palavra.significa", "O que significa")}</p>
        <p className="text-sm leading-snug mt-0.5" style={{ color: C.ink }} data-testid="balao-sig">{palavra.sig}</p>
        {palavra.valor && <p className="text-sm leading-snug mt-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "#7B5CB212", color: C.violet }}><b>{t("palavra.hoje", "Em números de hoje:")}</b> {palavra.valor}</p>}
        <button onClick={() => aoImersao(palavra)} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(120deg,#1A1030,#3A2563)", color: "#F3E6B8" }} data-testid="balao-imersao">
          <BookOpen size={15} /> {t("palavra.imersao", "Aprender mais (imersão)")}
        </button>
      </div>
    </div>
  );
}

const Secao = ({ titulo, children, testid }) => (
  <section className="mb-5" data-testid={testid}>
    <h3 className="text-xs font-mono uppercase tracking-[0.18em] font-semibold mb-1.5" style={{ color: C.goldDeep }}>{titulo}</h3>
    <div className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{children}</div>
  </section>
);

export function ImersaoPalavra({ palavra, aoVoltar, aoIrPara }) {
  useIdioma();
  const [ia, setIa] = useState({ s: "idle" });
  const [ligada, setLigada] = useState(false);
  const [falou, setFalou] = useState("");
  useEffect(() => { iaLigada().then(setLigada); window.scrollTo && window.scrollTo(0, 0); }, []);
  const dizer = (devagar) => { const ok = falar(palavra.termo, { rate: devagar ? 0.5 : 0.9 }); setFalou(ok ? "" : t("falar.semSuporte", "Este aparelho não consegue falar em voz alta.")); };
  const aprofundar = async () => {
    setIa({ s: "carregando" });
    const r = await iaPedir("palavra", { termo: palavra.termo, ref: palavra.onde[0] ? palavra.onde[0][3] : "" });
    if (r.ok) setIa({ s: "ok", d: r.dados });
    else { const m = MOTIVOS_IA[r.motivo] || ["ia.falha", "Não consegui falar com a IA agora."]; setIa({ s: "erro", m: t(m[0], m[1]) }); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 75, overflowY: "auto", background: C.parchment }} data-testid="imersao-palavra" role="dialog" aria-label={palavra.termo}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={aoVoltar} className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 focus:outline-none focus:ring-2 rounded-md px-1" style={{ color: C.goldDeep }} data-testid="imersao-voltar"><ArrowLeft size={16} /> {t("imersao.voltar", "Voltar à leitura")}</button>
        <p className="uppercase text-xs tracking-[0.2em] font-mono font-semibold" style={{ color: C.gold }}>{t("imersao.rotulo", "Imersão na palavra")} · {palavra.tipo}</p>
        <h1 className="font-display text-4xl font-bold mt-1" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{palavra.termo}</h1>
        <div className="w-14 h-0.5 mt-3 mb-6" style={{ background: C.gold }} />

        <Secao titulo={t("imersao.falar", "Como falar")} testid="imersao-falar">
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${C.gold}55` }}>
            <p className="text-4xl font-extrabold tracking-wide" style={{ color: C.violet }}>{palavra.silabas}</p>
            <p className="text-xs mt-1" style={{ color: C.stone }}>{t("palavra.dicaSilaba", "A parte em MAIÚSCULAS é a sílaba mais forte.")}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => dizer(false)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold" style={{ background: C.ink, color: C.goldBright }}><Volume2 size={15} /> {t("palavra.ouvir", "Ouvir")}</button>
              <button onClick={() => dizer(true)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border" style={{ borderColor: C.gold, color: C.goldDeep }}><Clock size={15} /> {t("palavra.devagar", "Devagar")}</button>
            </div>
            <p className="text-xs mt-3" style={{ color: C.stone }}>{t("imersao.repita", "Dica: ouça devagar, repita em voz alta três vezes e depois leia o versículo inteiro.")}</p>
            {falou && <p className="text-xs mt-1" style={{ color: "#B03428" }}>{falou}</p>}
          </div>
        </Secao>
        <Secao titulo={t("palavra.significa", "O que significa")} testid="imersao-sig">
          <p>{palavra.sig}</p>
          {palavra.valor && <p className="mt-2 rounded-lg px-3 py-2" style={{ background: "#7B5CB212", color: C.violet }}><b>{t("palavra.hoje", "Em números de hoje:")}</b> {palavra.valor}</p>}
        </Secao>
        <Secao titulo={t("imersao.origem", "De onde vem a palavra e em que língua")} testid="imersao-origem"><p>{palavra.origem}</p></Secao>
        <Secao titulo={t("imersao.contexto", "Contexto")} testid="imersao-contexto"><p>{palavra.contexto}</p></Secao>
        {palavra.onde.length > 0 && (
          <Secao titulo={t("imersao.onde", "Onde aparece na Bíblia")} testid="imersao-onde">
            <div className="flex flex-wrap gap-2">
              {palavra.onde.map(([ab, c, v, rot]) => (
                <button key={rot} onClick={() => aoIrPara(ab, c, v)} data-testid="imersao-ref" className="rounded-full px-3.5 py-1.5 text-sm font-semibold border focus:outline-none focus:ring-2" style={{ borderColor: C.gold, color: C.goldDeep, background: "#fff" }}>{rot}</button>
              ))}
            </div>
          </Secao>
        )}
        <Secao titulo={t("imersao.ia", "Quer ir mais fundo?")} testid="imersao-ia">
          {ia.s === "ok" ? (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${C.gold}55` }} data-testid="imersao-ia-resposta">
              <p>{ia.d.resumo}</p>
              {ia.d.origem && <p><b>{t("imersao.origem", "De onde vem a palavra e em que língua")}:</b> {ia.d.origem}</p>}
              {ia.d.contexto && <p><b>{t("imersao.contexto", "Contexto")}:</b> {ia.d.contexto}</p>}
              {ia.d.usoBiblico && <p><b>{t("imersao.uso", "Como a Bíblia usa")}:</b> {ia.d.usoBiblico}</p>}
              {ia.d.curiosidades && ia.d.curiosidades.length > 0 && <ul className="list-disc pl-5">{ia.d.curiosidades.map((x, i) => <li key={i}>{x}</li>)}</ul>}
              <p className="text-[11px]" style={{ color: C.stone }}>{t("ia.aviso", "Explicação gerada por inteligência artificial. Confira sempre com a Palavra e com o seu pastor.")}</p>
            </div>
          ) : (
            <div>
              <button onClick={aprofundar} disabled={ia.s === "carregando" || !ligada} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50" style={{ background: C.gold, color: "#fff" }} data-testid="imersao-ia-btn">
                {ia.s === "carregando" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {t("imersao.iaBotao", "Aprofundar com inteligência artificial")}
              </button>
              {!ligada && <p className="text-xs mt-2" style={{ color: C.stone }} data-testid="imersao-ia-off">{t("ia.desligada", "A inteligência artificial ainda não foi ativada neste app. Peça ao administrador para colocar a chave.")}</p>}
              {ia.s === "erro" && <p className="text-xs mt-2" style={{ color: "#B03428" }}>{ia.m}</p>}
            </div>
          )}
        </Secao>
      </div>
    </div>
  );
}

/* ------------------------- interpretação por IA ------------------------- */
const chaveCache = (tr, abbr, c, v1, v2) => `biblia:ia:${tr}:${abbr}:${c}:${v1}-${v2}:${idioma()}`;
export function PainelInterpretacao({ tr, abbr, c, v1, v2, versiculos, aoPedirTrecho }) {
  useIdioma();
  const [ligada, setLigada] = useState(null);
  const [est, setEst] = useState({ s: "idle" });
  const trecho = v1 ? `${BIB.textoReferencia(abbr, c, v1, v2)}` : "";
  useEffect(() => { iaLigada().then(setLigada); }, []);
  useEffect(() => {
    setEst({ s: "idle" });
    if (!v1) return;
    try { const c0 = JSON.parse(localStorage.getItem(chaveCache(tr, abbr, c, v1, v2)) || "null"); if (c0) setEst({ s: "ok", d: c0 }); } catch (e) { /* sem cache */ }
  }, [tr, abbr, c, v1, v2]);
  const pedir = async () => {
    if (!v1) { aoPedirTrecho(); return; }
    setEst({ s: "carregando" });
    const r = await iaPedir("interpretar", { ref: trecho, traducao: BIB.traducaoDe(tr).sigla, versiculos: versiculos.filter((x) => x.n >= v1 && x.n <= v2).slice(0, 40).map((x) => ({ n: x.n, t: x.t })) });
    if (r.ok) { setEst({ s: "ok", d: r.dados }); try { localStorage.setItem(chaveCache(tr, abbr, c, v1, v2), JSON.stringify(r.dados)); } catch (e) { /* ok */ } }
    else { const m = MOTIVOS_IA[r.motivo] || ["ia.falha", "Não consegui falar com a IA agora."]; setEst({ s: "erro", m: t(m[0], m[1]), motivo: r.motivo }); }
  };
  return (
    <div className="mb-4" data-testid="painel-interpretacao">
      <button onClick={pedir} disabled={est.s === "carregando"} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border focus:outline-none focus:ring-2 disabled:opacity-60" style={{ borderColor: C.violet + "66", color: C.violet, background: "#7B5CB210" }} data-testid="btn-interpretar">
        {est.s === "carregando" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {v1 ? t("ia.interpretar", "Interpretar {ref} com IA", { ref: trecho }) : t("ia.interpretarSem", "Interpretar com IA")}
      </button>
      {ligada === false && <p className="text-xs mt-1.5" style={{ color: C.stone }} data-testid="ia-desligada">{t("ia.desligada", "A inteligência artificial ainda não foi ativada neste app. Peça ao administrador para colocar a chave.")}</p>}
      {est.s === "erro" && <p className="text-xs mt-1.5" style={{ color: "#B03428" }} data-testid="ia-erro">{est.m}</p>}
      {est.s === "ok" && (
        <div className="mt-3 rounded-2xl p-4 space-y-3 text-[15px] leading-relaxed" style={{ background: "#fff", border: `1px solid ${C.violet}33`, color: C.ink }} data-testid="interpretacao-resposta">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.violet }}>{t("ia.titulo", "Interpretação")} · {trecho}</p>
          {est.d.contexto && <p><b>{t("ia.contexto", "Contexto")}:</b> {est.d.contexto}</p>}
          {est.d.significado && <p><b>{t("ia.significado", "O que diz")}:</b> {est.d.significado}</p>}
          {est.d.aplicacao && <p><b>{t("ia.aplicacao", "Para a vida hoje")}:</b> {est.d.aplicacao}</p>}
          {est.d.referencias && est.d.referencias.length > 0 && <p><b>{t("ia.referencias", "Veja também")}:</b> {est.d.referencias.join(" · ")}</p>}
          {est.d.observacao && <p style={{ color: C.stone }}><i>{est.d.observacao}</i></p>}
          <p className="text-[11px]" style={{ color: C.stone }}>{t("ia.aviso", "Explicação gerada por inteligência artificial. Confira sempre com a Palavra e com o seu pastor.")}</p>
          <button onClick={() => { try { localStorage.removeItem(chaveCache(tr, abbr, c, v1, v2)); } catch (e) { /* ok */ } pedir(); }} className="text-xs underline" style={{ color: C.violet }}>{t("ia.refazer", "Gerar de novo")}</button>
        </div>
      )}
    </div>
  );
}
