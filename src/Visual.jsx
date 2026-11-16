// Visual novo da Bíblia Avivar (cabeçalho roxo, menu, abas de baixo, página "Bíblia" com os grupos de livros,
// pergaminho). Só aparência: as funções do app continuam no App.jsx e no Leitor.jsx.
import React, { useState, useEffect, useRef } from "react";
import {
  Menu, Search, Bookmark, Home as HomeIcon, BookOpen, CalendarDays, Headphones, LayoutGrid, X, ChevronRight,
  ChevronLeft, ChevronDown, Play, WifiOff, Download, Loader2, CheckCircle2,
} from "lucide-react";
import { OLD_TESTAMENT, NEW_TESTAMENT } from "./lib/bibleData.js";
import * as BIB from "./lib/biblia.js";
import { t, useIdioma } from "./lib/i18n.js";
import { SeletorIdioma, nomeLivro } from "./Leitor.jsx";

export const V = {
  fundo: "linear-gradient(180deg, #1b0e42 0%, #2a1668 36%, #1a0d3d 100%)",
  ouro: "#E9C765",
  ouro2: "#CBA135",
  ouroEscuro: "#8B6F1F",
  lilas: "#C9C2D8",
  tinta: "#2a1450",
  badge: "#4B1F86",
};
const serifa = "'Playfair Display', Georgia, serif";
export const ouroTexto = {
  backgroundImage: "linear-gradient(180deg, #fff1bb 0%, #f2c45c 42%, #cf7a31 100%)",
  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent",
};

/* ------------------------------------------------------------------ */
/* Marca: livro aberto com chama                                       */
/* ------------------------------------------------------------------ */
export function MarcaLivro({ size = 44 }) {
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 80 64" aria-hidden="true">
      <defs>
        <linearGradient id="mlv-chama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset=".55" stopColor="#f6a623" /><stop offset="1" stopColor="#d9571f" /></linearGradient>
        <linearGradient id="mlv-ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbe7a0" /><stop offset="1" stopColor="#c58b2c" /></linearGradient>
      </defs>
      <path d="M40 3c5 10 13 14 11 25-1 7-6 10-11 10s-10-3-11-10c-1-8 5-12 8-18 1 4 3 5 3 5s-1-7 0-12z" fill="url(#mlv-chama)" />
      <path d="M40 17c3 6 6 8 5 14-.6 4-3 6-5 6s-4.4-2-5-6c-.7-5 3-8 5-14z" fill="#fff6c8" opacity=".85" />
      <path d="M40 58C30 51 17 49 5 51V35c12-2 25 0 35 7z" fill="url(#mlv-ouro)" stroke="#8B6F1F" strokeWidth="1" />
      <path d="M40 58c10-7 23-9 35-7V35c-12-2-25 0-35 7z" fill="url(#mlv-ouro)" stroke="#8B6F1F" strokeWidth="1" />
      <path d="M40 42v16" stroke="#8B6F1F" strokeWidth="1.4" />
      <path d="M11 41c9-1 18 .5 26 5M11 46c9-1 18 .5 26 5M69 41c-9-1-18 .5-26 5M69 46c-9-1-18 .5-26 5" stroke="#8B6F1F" strokeWidth=".7" fill="none" opacity=".6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Cabeçalho (faixa roxa com paisagem)                                 */
/* ------------------------------------------------------------------ */
export function Cabecalho({ onMenu, onBusca, onMarcadores, onHome, compacto }) {
  useIdioma();
  const icone = { color: V.ouro, filter: "drop-shadow(0 1px 3px #0009)" };
  if (compacto) {
    return (
      <header className="flex items-center justify-between px-2 py-1.5" style={{ background: "linear-gradient(180deg, #1a0c40, #2c1670)", borderBottom: "1px solid #CBA13566" }}>
        <button onClick={onMenu} data-testid="abrir-menu" aria-label={t("menu.abrir", "Abrir o menu")} className="p-2 rounded-md focus:outline-none focus:ring-2"><Menu size={24} style={icone} /></button>
        <button onClick={onHome} aria-label="Bíblia Avivar — início" className="font-bold text-[20px] focus:outline-none" style={{ ...ouroTexto, fontFamily: serifa }}>Bíblia Avivar</button>
        <button onClick={onMarcadores} data-testid="abrir-anotacoes" aria-label={t("nav.anotacoesTitulo", "Minhas anotações")} className="p-2 rounded-md focus:outline-none focus:ring-2"><Bookmark size={22} style={icone} /></button>
      </header>
    );
  }
  return (
    <header className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #1a0c40 0%, #33196f 46%, #5d2a86 72%, #b4603f 100%)", minHeight: 120 }}>
      <svg className="absolute inset-x-0 bottom-0 w-full" height="74" viewBox="0 0 400 74" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id="cab-brilho" cx="50%" cy="100%" r="62%"><stop offset="0" stopColor="#ffd98a" stopOpacity=".95" /><stop offset=".45" stopColor="#ff9a4d" stopOpacity=".45" /><stop offset="1" stopColor="#ff9a4d" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="400" height="74" fill="url(#cab-brilho)" />
        <circle cx="200" cy="64" r="7" fill="#fff0b8" opacity=".9" />
        <path d="M0 74V50l34-16 28 14 40-26 46 30 34-18 44 20 40-24 38 26 40-18 30 14 26-10v52z" fill="#4a2477" opacity=".9" />
        <path d="M0 74V58l46-16 40 18 50-22 52 24 46-16 48 20 44-14 38 12 36-8v38z" fill="#2c1556" />
      </svg>
      <div className="relative z-10 flex items-start justify-between px-3 pt-3 pb-6">
        <div className="w-[76px] flex justify-start">
          <button onClick={onMenu} data-testid="abrir-menu" aria-label={t("menu.abrir", "Abrir o menu")} className="p-2 -ml-1 rounded-md focus:outline-none focus:ring-2"><Menu size={30} style={icone} /></button>
        </div>
        <button onClick={onHome} aria-label="Bíblia Avivar — início" className="flex flex-col items-center focus:outline-none">
          <MarcaLivro size={42} />
          <span className="mt-0.5 leading-none font-bold text-[30px] sm:text-[34px]" style={{ ...ouroTexto, fontFamily: serifa, textShadow: "none", filter: "drop-shadow(0 2px 4px #0008)" }}>Bíblia Avivar</span>
        </button>
        <div className="w-[76px] flex justify-end items-center gap-1">
          <button onClick={onBusca} data-testid="abrir-busca" aria-label={t("busca.abrir", "Buscar na Bíblia")} className="p-2 rounded-md focus:outline-none focus:ring-2"><Search size={26} style={icone} /></button>
          <button onClick={onMarcadores} data-testid="abrir-anotacoes" aria-label={t("nav.anotacoesTitulo", "Minhas anotações")} className="p-2 -mr-1 rounded-md focus:outline-none focus:ring-2"><Bookmark size={26} style={icone} /></button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Menu lateral (o "☰")                                                */
/* ------------------------------------------------------------------ */
export function MenuLateral({ aberto, onFechar, itens, atualizar }) {
  useIdioma();
  useEffect(() => {
    if (!aberto) return undefined;
    const f = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t("menu.titulo", "Menu")} data-testid="menu-lateral">
      <button className="absolute inset-0 w-full h-full cursor-default" style={{ background: "#000000a8" }} onClick={onFechar} aria-label={t("menu.fechar", "Fechar o menu")} />
      <aside className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[330px] overflow-y-auto flex flex-col" style={{ background: "linear-gradient(180deg, #2c1770 0%, #170b3a 100%)", borderRight: "1.5px solid #CBA13588", boxShadow: "6px 0 30px #000a" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #CBA13544" }}>
          <img src="/logo-icone.png" alt="" className="h-10 w-auto" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight" style={{ ...ouroTexto, fontFamily: serifa }}>Bíblia Avivar</p>
            <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: V.lilas }}>Ministério Avivar do Espírito</p>
          </div>
          <button onClick={onFechar} aria-label={t("menu.fechar", "Fechar o menu")} className="p-2 rounded-md focus:outline-none focus:ring-2"><X size={22} color={V.ouro} /></button>
        </div>
        {atualizar && (
          <div className="mx-4 mt-3 rounded-xl p-3 flex items-center gap-3" data-testid="menu-atualizar-bloco" style={{ background: "#ffffff12", border: "1px solid #CBA13566" }}>
            <WifiOff size={20} color={V.ouro} className="shrink-0" />
            <p className="flex-1 text-[14px] font-semibold leading-tight" style={{ color: "#fff" }}>{t("atualizar.msg", "Leia a Bíblia sem internet")}</p>
            <button onClick={atualizar.baixar} disabled={atualizar.estado === "baixando"} data-testid="menu-atualizar" className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold disabled:opacity-70 focus:outline-none focus:ring-2" style={{ background: "linear-gradient(180deg,#f6d77d,#c9952f)", color: "#2a1450" }}>
              {atualizar.estado === "baixando" ? <><Loader2 size={14} className="animate-spin" /> {t("atualizar.baixando", "Baixando…")}</> : <>{atualizar.estado === "pronto" ? <CheckCircle2 size={14} /> : <Download size={14} />} {t("atualizar.botao", "Atualizar")}</>}
            </button>
          </div>
        )}
        {atualizar && atualizar.estado === "erro" && <p className="mx-4 mt-1.5 text-[11px]" style={{ color: "#ffb4a8" }}>{atualizar.erro}</p>}
        <nav className="flex-1 py-2">
          {itens.filter(Boolean).map((it, i) => it.titulo ? (
            <p key={"t" + i} className="px-4 pt-4 pb-1 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: V.ouro2 }}>{it.titulo}</p>
          ) : (
            <button key={it.k || i} onClick={it.onClick} data-testid={"menu-" + it.k} className="w-full flex items-center gap-3 px-4 py-3 text-left focus:outline-none focus:bg-white/10 active:bg-white/10" style={{ color: "#fff" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#CBA13522", border: "1px solid #CBA13555" }}>{it.icone ? <it.icone size={17} color={V.ouro} /> : null}</span>
              <span className="flex-1 min-w-0"><span className="block text-[15px] font-semibold leading-tight">{it.rotulo}</span>{it.sub && <span className="block text-[11px] leading-snug mt-0.5" style={{ color: V.lilas }}>{it.sub}</span>}</span>
              <ChevronRight size={16} color={V.ouro2} />
            </button>
          ))}
          <div className="flex items-center justify-between px-4 py-3 mt-1" style={{ borderTop: "1px solid #CBA13533" }}>
            <span className="text-[13px] font-semibold" style={{ color: "#fff" }}>{t("idioma.titulo", "Idioma")}</span>
            <SeletorIdioma />
          </div>
        </nav>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barra de baixo (5 abas)                                             */
/* ------------------------------------------------------------------ */
const ABAS = [
  ["home", "nav.inicio", "Início", HomeIcon],
  ["biblia", "nav.biblia", "Bíblia", BookOpen],
  ["planos", "nav.planos", "Planos", CalendarDays],
  ["audio", "nav.audio", "Áudio", Headphones],
  ["mais", "nav.mais", "Mais", LayoutGrid],
];
export function BarraInferior({ atual, onIr }) {
  useIdioma();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40" aria-label="Seções do app" data-testid="barra-inferior" style={{ background: "linear-gradient(180deg, #2a1668 0%, #150a35 100%)", borderTop: "1.5px solid #CBA135aa", boxShadow: "0 -6px 20px #0008", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {ABAS.map(([k, chave, rotulo, Icone]) => {
          const ativa = atual === k;
          return (
            <button key={k} onClick={() => onIr(k)} data-testid={"aba-inf-" + k} aria-current={ativa ? "page" : undefined} className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[58px] focus:outline-none focus:bg-white/10" style={{ color: ativa ? V.ouro : "#CFC6E6" }}>
              <Icone size={24} strokeWidth={ativa ? 2.2 : 1.8} />
              <span className="text-[12px] font-semibold leading-none">{t(chave, rotulo)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Pergaminho                                                          */
/* ------------------------------------------------------------------ */
export function Folha({ children, className = "", style }) {
  return <div className={"folha-papiro rounded-2xl " + className} style={style}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Grupos de livros (cards com ilustração)                             */
/* ------------------------------------------------------------------ */
export const GRUPOS_AT = [
  { id: "lei", chave: "grupo.lei", nome: "Pentateuco" },
  { id: "hist", chave: "grupo.hist", nome: "Históricos" },
  { id: "poet", chave: "grupo.poet", nome: "Poéticos e Sapienciais" },
  { id: "pmai", chave: "grupo.pmai", nome: "Proféticos Maiores" },
  { id: "pmen", chave: "grupo.pmen", nome: "Proféticos Menores" },
];
export const GRUPOS_NT = [
  { id: "evan", chave: "grupo.evan", nome: "Evangelhos" },
  { id: "atos", chave: "grupo.atos", nome: "Atos dos Apóstolos" },
  { id: "paul", chave: "grupo.paul", nome: "Cartas de Paulo" },
  { id: "ger", chave: "grupo.ger", nome: "Cartas Gerais" },
  { id: "apoc", chave: "grupo.apoc", nome: "Apocalipse" },
];
const livrosDoGrupo = (id) => [...OLD_TESTAMENT, ...NEW_TESTAMENT].filter((b) => { const l = BIB.achaLivro(b.abbr); return l && l.grupo === id; });

function Cena({ id, a, b, c, children }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={"cs-" + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset=".6" stopColor={b} /><stop offset="1" stopColor={c} /></linearGradient>
        <radialGradient id={"cb-" + id} cx="50%" cy="55%" r="55%"><stop offset="0" stopColor="#ffe3a0" stopOpacity=".85" /><stop offset="1" stopColor="#ffe3a0" stopOpacity="0" /></radialGradient>
        <linearGradient id={"co-" + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbe7a0" /><stop offset="1" stopColor="#b9801f" /></linearGradient>
      </defs>
      <rect width="200" height="150" fill={"url(#cs-" + id + ")"} />
      <rect width="200" height="150" fill={"url(#cb-" + id + ")"} />
      {children}
    </svg>
  );
}
const chama = (x, y, k = 1) => <path transform={`translate(${x} ${y}) scale(${k})`} d="M0-14c3 6 8 9 7 16-.6 5-3.500 7-7 7s-6.400-2-7-7c-1-7 4-10 7-16z" fill="#ffb02e" stroke="#fff3b0" strokeWidth=".8" />;
const ARTES = {
  lei: (
    <Cena id="lei" a="#2a1240" b="#8d4a2b" c="#e29a43">
      <circle cx="150" cy="38" r="22" fill="#ffd98a" opacity=".35" />
      <g transform="rotate(-6 100 90)">
        <rect x="52" y="62" width="98" height="56" fill="#efdca8" stroke="#9a7435" strokeWidth="1" />
        {[72, 80, 88, 96, 104].map((y) => <path key={y} d={`M62 ${y}h${y % 16 ? 76 : 62}`} stroke="#8a6a38" strokeWidth="1.6" opacity=".65" />)}
        <rect x="42" y="56" width="16" height="68" rx="8" fill="url(#co-lei)" stroke="#7a5a1c" strokeWidth="1" />
        <rect x="144" y="56" width="16" height="68" rx="8" fill="url(#co-lei)" stroke="#7a5a1c" strokeWidth="1" />
      </g>
      <g transform="rotate(14 150 60)"><rect x="140" y="28" width="12" height="52" rx="6" fill="#e6cf92" stroke="#8a6a38" strokeWidth="1" /><ellipse cx="146" cy="30" rx="6" ry="3" fill="#f4e6bd" /></g>
      <path d="M0 150v-16c40-8 120-8 200 0v16z" fill="#3a1d32" />
    </Cena>
  ),
  hist: (
    <Cena id="hist" a="#3b1d6e" b="#b5546a" c="#f2a24a">
      <circle cx="100" cy="82" r="30" fill="#ffd98a" opacity=".45" />
      <path d="M0 150V112c30-16 60-18 100-18s70 2 100 18v38z" fill="#2a1736" />
      <g fill="#6f5a82" stroke="#33203f" strokeWidth=".8">
        <rect x="76" y="62" width="48" height="42" /><rect x="52" y="48" width="24" height="56" /><rect x="124" y="48" width="24" height="56" />
        <path d="M50 48l14-18 14 18zM122 48l14-18 14 18z" fill="#a14a52" />
        {[76, 86, 96, 106, 116].map((x) => <rect key={x} x={x} y="57" width="6" height="6" />)}
      </g>
      <path d="M90 104V86a10 10 0 0120 0v18z" fill="#2a1736" />
      {[[60, 70], [136, 70], [100, 74]].map(([x, y]) => <rect key={x} x={x - 2} y={y} width="4" height="9" rx="2" fill="#ffd36e" />)}
      <path d="M64 30v-12l12 4-12 4M136 30v-12l12 4-12 4" fill="#e9c765" />
      <path d="M0 150v-14c50-10 150-10 200 0v14z" fill="#1d0f2c" />
    </Cena>
  ),
  poet: (
    <Cena id="poet" a="#1c0e45" b="#5a2a86" c="#c1623a">
      <circle cx="100" cy="76" r="44" fill="#ffd98a" opacity=".28" />
      <path d="M70 116C64 72 80 40 118 30c14-3 22 6 16 18-12 4-20 22-20 68z" fill="url(#co-poet)" stroke="#7a5a1c" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${80 + i * 5} ${112 - i * 1.5}L${116 + i * 1.2} ${48 + i * 9}`} stroke="#fff1bb" strokeWidth="1" opacity=".9" />)}
      <path d="M62 118h60l6 8H56z" fill="url(#co-poet)" stroke="#7a5a1c" strokeWidth="1" />
      <path d="M0 150v-10c50-8 150-8 200 0v10z" fill="#1d0f2c" />
    </Cena>
  ),
  pmai: (
    <Cena id="pmai" a="#2b1560" b="#a5476a" c="#f0a145">
      <circle cx="140" cy="66" r="26" fill="#ffd98a" opacity=".5" />
      <path d="M0 150V108l36-24 30 20 36-34 40 36 30-18 28 22v40z" fill="#4d2a62" opacity=".9" />
      <path d="M0 150v-18c50-12 150-12 200 0v18z" fill="#2a1736" />
      <path d="M96 66c-8 8-12 40-16 62h40c-4-22-8-54-16-62z" fill="#3d1f55" stroke="#1d0f2c" strokeWidth="1" />
      <circle cx="104" cy="58" r="7" fill="#e3b78a" /><path d="M96 56c0-8 16-8 16 0 0 3-3 2-8 2s-8 1-8-2z" fill="#3d1f55" />
      <path d="M124 42v90" stroke="#d6a84a" strokeWidth="2.6" strokeLinecap="round" /><circle cx="124" cy="40" r="4" fill="none" stroke="#d6a84a" strokeWidth="2.2" />
    </Cena>
  ),
  pmen: (
    <Cena id="pmen" a="#24103a" b="#6a2f3c" c="#d98a3a">
      <circle cx="132" cy="84" r="36" fill="#ffd98a" opacity=".4" />
      <g transform="rotate(-18 58 90)"><rect x="30" y="64" width="62" height="40" fill="#efdca8" stroke="#9a7435" strokeWidth="1" />{[74, 82, 90, 98].map((y) => <path key={y} d={`M38 ${y}h46`} stroke="#8a6a38" strokeWidth="1.4" opacity=".6" />)}<rect x="24" y="60" width="12" height="48" rx="6" fill="url(#co-pmen)" /><rect x="86" y="60" width="12" height="48" rx="6" fill="url(#co-pmen)" /></g>
      <path d="M104 118c10 10 40 10 52 0-4-8-12-10-26-10s-22 2-26 10z" fill="url(#co-pmen)" stroke="#7a5a1c" strokeWidth="1.2" />
      <path d="M156 114c10-2 14 4 8 8" fill="none" stroke="#c58b2c" strokeWidth="2.4" /><path d="M104 118l-10-6" stroke="#c58b2c" strokeWidth="3" strokeLinecap="round" />
      {chama(130, 100, 1.5)}
      <path d="M0 150v-8c50-6 150-6 200 0v8z" fill="#1d0f2c" />
    </Cena>
  ),
  evan: (
    <Cena id="evan" a="#3a1d78" b="#b9577a" c="#f5b24c">
      {[...Array(14)].map((_, i) => <path key={i} d={`M100 74L${100 + 130 * Math.cos((i / 14) * Math.PI * 2)} ${74 + 130 * Math.sin((i / 14) * Math.PI * 2)}`} stroke="#fff0b8" strokeWidth="2" opacity=".18" />)}
      <path d="M0 150v-30c50-18 150-18 200 0v30z" fill="#2a1736" />
      <rect x="96" y="40" width="8" height="82" fill="#f6dd9a" stroke="#8a6a38" strokeWidth="1" /><rect x="80" y="56" width="40" height="8" fill="#f6dd9a" stroke="#8a6a38" strokeWidth="1" />
    </Cena>
  ),
  atos: (
    <Cena id="atos" a="#2a0f30" b="#8c2f3a" c="#f08a2e">
      <path d="M0 40c40-14 80 12 120-2s60-4 80 6" fill="none" stroke="#ffd98a" strokeWidth="2" opacity=".35" /><path d="M0 70c50-16 90 10 130-2s50-6 70 4" fill="none" stroke="#ffd98a" strokeWidth="2" opacity=".25" />
      {chama(100, 96, 4.2)}{chama(52, 100, 2.4)}{chama(148, 100, 2.4)}
      <path d="M0 150v-12c50-10 150-10 200 0v12z" fill="#1d0f2c" />
    </Cena>
  ),
  paul: (
    <Cena id="paul" a="#1a1a52" b="#3b3f96" c="#c98a45">
      <g transform="rotate(-8 100 88)"><rect x="54" y="52" width="86" height="72" fill="#efdca8" stroke="#9a7435" strokeWidth="1" />{[66, 76, 86, 96].map((y) => <path key={y} d={`M64 ${y}h${y % 20 ? 62 : 50}`} stroke="#8a6a38" strokeWidth="1.5" opacity=".65" />)}<circle cx="112" cy="112" r="9" fill="#a3262e" stroke="#6e1219" strokeWidth="1" /></g>
      <path d="M150 28c-20 14-34 40-44 78l10-6c8-16 22-36 34-72z" fill="#f4ead2" stroke="#8a6a38" strokeWidth="1" /><path d="M106 106l-6 14" stroke="#3b2a1a" strokeWidth="2" />
      <path d="M0 150v-10c50-8 150-8 200 0v10z" fill="#12123a" />
    </Cena>
  ),
  ger: (
    <Cena id="ger" a="#143a4a" b="#2f6f7c" c="#d89a54">
      <g transform="rotate(7 100 84)"><rect x="46" y="58" width="108" height="68" rx="4" fill="#efdca8" stroke="#9a7435" strokeWidth="1" /><path d="M46 60l54 36 54-36" fill="none" stroke="#9a7435" strokeWidth="1.4" /><circle cx="100" cy="92" r="9" fill="#a3262e" stroke="#6e1219" strokeWidth="1" /></g>
      <g transform="rotate(-9 70 60)"><rect x="40" y="38" width="70" height="44" rx="3" fill="#f6e9bf" stroke="#9a7435" strokeWidth="1" opacity=".85" /></g>
      <path d="M0 150v-10c50-8 150-8 200 0v10z" fill="#0f2833" />
    </Cena>
  ),
  apoc: (
    <Cena id="apoc" a="#0e0a2e" b="#3a1d78" c="#b4603f">
      {[[20, 20], [52, 36], [160, 24], [182, 50], [30, 70], [172, 84], [120, 14]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff6c8" />)}
      <path d="M100 126V62M100 126c-14 0-24-8-26-26V70M100 126c14 0 24-8 26-26V70M100 126c-26 0-46-12-48-38V76M100 126c26 0 46-12 48-38V76M100 126c-36 0-64-12-66-48V64M100 126c36 0 64-12 66-48V64" fill="none" stroke="url(#co-apoc)" strokeWidth="3.4" strokeLinecap="round" />
      {[100, 74, 126, 52, 148, 34, 166].map((x, i) => <g key={i}>{chama(x, [58, 66, 66, 72, 72, 60, 60][i], 1)}</g>)}
      <rect x="74" y="124" width="52" height="8" rx="3" fill="url(#co-apoc)" /><path d="M0 150v-8c50-6 150-6 200 0v8z" fill="#120b2c" />
    </Cena>
  ),
};

export function CardGrupo({ g, onClick, alto = 150 }) {
  useIdioma();
  const [imagem, setImagem] = useState(false); // se existir /grupos/<id>.jpg, usa a imagem no lugar do desenho
  const n = livrosDoGrupo(g.id).length;
  return (
    <button onClick={onClick} data-testid={"grupo-" + g.id} className="relative overflow-hidden rounded-xl text-left w-full focus:outline-none focus:ring-2 active:scale-[0.98] transition" style={{ height: alto, border: "1.5px solid #D6A84a", boxShadow: "0 5px 16px #0009, inset 0 0 0 1px #ffffff26", background: "#1d0f45" }}>
      {ARTES[g.id]}
      <img src={`/grupos/${g.id}.jpg`} alt="" onLoad={() => setImagem(true)} onError={() => {}} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: imagem ? 1 : 0 }} />
      <span className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2 text-center" style={{ background: "linear-gradient(180deg, transparent, rgba(22,8,52,.92) 70%)" }}>
        <span className="block font-bold leading-tight text-[16px] sm:text-[18px]" style={{ color: "#fff", fontFamily: serifa, textShadow: "0 2px 6px #000" }}>{t(g.chave, g.nome)}</span>
        <span className="block text-[12px] mt-0.5" style={{ color: "#E8DFFA" }}>({n} {n === 1 ? t("grupo.livro", "livro") : t("grupo.livros", "livros")})</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Página "Bíblia": abas Antigo/Novo Testamento + grupos de livros      */
/* ------------------------------------------------------------------ */
export function PaginaBiblia({ onOpenBook, sinalBusca }) {
  useIdioma();
  const [testamento, setTestamento] = useState(() => { try { return sessionStorage.getItem("biblia:testamento") || "at"; } catch (e) { return "at"; } });
  const [grupo, setGrupo] = useState(null);
  const [consulta, setConsulta] = useState("");
  const [busca, setBusca] = useState(false);
  const entrada = useRef(null);
  const trocar = (k) => { setTestamento(k); setGrupo(null); try { sessionStorage.setItem("biblia:testamento", k); } catch (e) { /* ok */ } };
  useEffect(() => {
    if (!sinalBusca) return;
    setBusca(true);
    const id = setTimeout(() => { if (entrada.current) entrada.current.focus(); }, 80);
    return () => clearTimeout(id);
  }, [sinalBusca]);

  const grupos = testamento === "at" ? GRUPOS_AT : GRUPOS_NT;
  const q = BIB.semAcento(consulta.trim());
  const todos = [...OLD_TESTAMENT, ...NEW_TESTAMENT];
  const achados = q ? todos.filter((b) => BIB.semAcento(b.name).includes(q)) : [];
  const ref = consulta.trim() ? BIB.lerReferencia(consulta) : null;
  const refLivro = ref ? todos.find((b) => b.abbr === ref.abbr) : null;
  const abrir = (b, cap, faixa) => { onOpenBook(b, cap || null, "ler", faixa || null); };
  const livroBotao = (b) => {
    const l = BIB.achaLivro(b.abbr);
    return (
      <button key={b.abbr} onClick={() => abrir(b)} data-testid={"livro-" + b.abbr} className="text-left rounded-xl px-3 py-3 focus:outline-none focus:ring-2 active:scale-[0.98] transition" style={{ background: "linear-gradient(180deg,#34197a,#1f0f4f)", border: "1.5px solid #CBA135aa", borderLeft: `5px solid ${l ? l.cor : V.ouro2}`, boxShadow: "0 3px 10px #0007" }}>
        <span className="block font-bold text-[15px] leading-tight" style={{ color: "#fff", fontFamily: serifa }}>{nomeLivro(b)}</span>
        <span className="block text-[11px] mt-0.5" style={{ color: V.lilas }}>{t("livro.caps", "{n} capítulos", { n: b.chapters })}</span>
      </button>
    );
  };
  const g = grupo ? grupos.find((x) => x.id === grupo) : null;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 pb-4">
      {busca && (
        <div className="mb-3 flex items-center gap-2 rounded-xl px-3" style={{ background: "#ffffff14", border: "1.5px solid #CBA135aa" }}>
          <Search size={18} color={V.ouro} />
          <input ref={entrada} value={consulta} onChange={(e) => setConsulta(e.target.value)} data-testid="busca-livro" placeholder={t("busca.placeholder", "Livro ou referência (ex.: Jo 3:16)")} aria-label={t("busca.abrir", "Buscar na Bíblia")} className="flex-1 bg-transparent py-3 text-[15px] focus:outline-none" style={{ color: "#fff" }} />
          <button onClick={() => { setConsulta(""); setBusca(false); }} aria-label={t("menu.fechar", "Fechar")} className="p-1"><X size={18} color={V.ouro} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 rounded-xl p-1" role="tablist" style={{ background: "#ffffff10", border: "1.5px solid #CBA135aa" }}>
        {[["at", t("tes.at", "Antigo Testamento")], ["nt", t("tes.nt", "Novo Testamento")]].map(([k, rotulo]) => {
          const ativa = testamento === k;
          return (
            <button key={k} role="tab" aria-selected={ativa} data-testid={"tes-" + k} onClick={() => trocar(k)} className="rounded-lg py-2.5 text-[16px] sm:text-[18px] font-semibold focus:outline-none focus:ring-2 transition" style={{ fontFamily: serifa, background: ativa ? "linear-gradient(180deg,#f6d77d,#c9952f)" : "transparent", color: ativa ? "#2a1450" : "#fff", boxShadow: ativa ? "0 2px 8px #0006, inset 0 1px 0 #fff8" : "none" }}>{rotulo}</button>
          );
        })}
      </div>

      <div className="mt-4">
        {q ? (
          <div data-testid="resultados-busca">
            {refLivro && <button onClick={() => abrir(refLivro, ref.c, ref.v1 ? { v1: ref.v1, v2: ref.v2 || ref.v1 } : null)} data-testid="abrir-referencia" className="w-full mb-3 flex items-center justify-between rounded-xl px-4 py-3 text-left" style={{ background: "linear-gradient(180deg,#f6d77d,#c9952f)", color: "#2a1450" }}><span className="font-bold" style={{ fontFamily: serifa }}>{t("busca.abrirRef", "Abrir")} {BIB.textoReferencia(ref.abbr, ref.c, ref.v1, ref.v2)}</span><ChevronRight size={18} /></button>}
            {achados.length ? <div className="grid grid-cols-2 gap-2.5">{achados.map(livroBotao)}</div> : !refLivro && <p className="text-sm text-center py-8" style={{ color: V.lilas }}>{t("busca.nada", "Nenhum livro encontrado.")}</p>}
          </div>
        ) : g ? (
          <div>
            <button onClick={() => setGrupo(null)} data-testid="voltar-grupos" className="inline-flex items-center gap-1 text-sm font-semibold mb-3 focus:outline-none focus:ring-2 rounded" style={{ color: V.ouro }}><ChevronLeft size={16} /> {t("grupo.voltar", "Grupos de livros")}</button>
            <h2 className="text-[24px] font-bold mb-3" style={{ ...ouroTexto, fontFamily: serifa }}>{t(g.chave, g.nome)}</h2>
            <div className="grid grid-cols-2 gap-2.5">{livrosDoGrupo(g.id).map(livroBotao)}</div>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2.5">
            {grupos.map((x, i) => (
              <div key={x.id} className={i < 3 ? "col-span-2" : "col-span-3"}>
                <CardGrupo g={x} alto={i < 3 ? 168 : 156} onClick={() => setGrupo(x.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-5 rounded-2xl overflow-hidden" style={{ height: 124, border: "1.5px solid #CBA135aa", boxShadow: "0 6px 18px #0009" }} aria-hidden="true">
        <img src="/2-biblia-hero-amanhecer.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "50% 72%" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,12,64,.55) 0%, rgba(26,12,64,0) 45%)" }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Planos de leitura (em preparo) e Áudio                              */
/* ------------------------------------------------------------------ */
export function PaginaPlanos({ ultimo, onContinuar, onBiblia }) {
  useIdioma();
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 pb-4">
      <Folha className="p-6 sm:p-8 text-center">
        <CalendarDays size={40} color={V.ouroEscuro} className="mx-auto" />
        <h2 className="mt-3 text-[28px] font-bold" style={{ color: V.tinta, fontFamily: serifa }}>{t("planos.titulo", "Planos de leitura")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#4a3a66" }}>{t("planos.texto", "Estamos preparando planos para você ler a Bíblia aos poucos, no seu ritmo. Em breve eles aparecem aqui.")}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {ultimo && <button onClick={onContinuar} className="rounded-full px-5 py-3 text-sm font-bold" style={{ background: "linear-gradient(180deg,#4b2a99,#2a1568)", color: "#fff" }}>{t("planos.continuar", "Continuar lendo")} · {ultimo.nome} {ultimo.capitulo}</button>}
          <button onClick={onBiblia} className="rounded-full px-5 py-3 text-sm font-bold" style={{ background: "linear-gradient(180deg,#f6d77d,#c9952f)", color: "#2a1450" }}>{t("planos.explorar", "Explorar a Bíblia")}</button>
        </div>
      </Folha>
    </div>
  );
}

export function PaginaAudio({ ultimo, onOuvir, livros }) {
  useIdioma();
  const inicial = ultimo ? livros.find((b) => b.abbr === ultimo.abbr) : null;
  const [abbr, setAbbr] = useState((inicial || livros[0]).abbr);
  const livro = livros.find((b) => b.abbr === abbr) || livros[0];
  const [cap, setCap] = useState(inicial ? Math.min(ultimo.capitulo, inicial.chapters) : 1);
  const caps = Array.from({ length: livro.chapters }, (_, i) => i + 1);
  const sel = "w-full appearance-none rounded-xl px-4 py-3 text-[15px] font-semibold focus:outline-none focus:ring-2";
  const selStyle = { background: "#fff", border: "1.5px solid #CBA135", color: V.tinta };
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 pb-4">
      <Folha className="p-6 sm:p-8">
        <div className="text-center">
          <Headphones size={40} color={V.ouroEscuro} className="mx-auto" />
          <h2 className="mt-3 text-[28px] font-bold" style={{ color: V.tinta, fontFamily: serifa }}>{t("audio.titulo", "Ouvir a Bíblia")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#4a3a66" }}>{t("audio.texto", "O aparelho lê o capítulo em voz alta. Escolha onde começar.")}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <label className="col-span-2 block"><span className="sr-only">{t("audio.livro", "Livro")}</span>
            <select value={abbr} onChange={(e) => { setAbbr(e.target.value); setCap(1); }} data-testid="audio-livro" className={sel} style={selStyle}>{livros.map((b) => <option key={b.abbr} value={b.abbr}>{nomeLivro(b)}</option>)}</select>
          </label>
          <label className="block"><span className="sr-only">{t("audio.cap", "Capítulo")}</span>
            <select value={cap} onChange={(e) => setCap(Number(e.target.value))} data-testid="audio-cap" className={sel} style={selStyle}>{caps.map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        </div>
        <button onClick={() => onOuvir(livro, cap)} data-testid="audio-ouvir" className="mt-4 w-full rounded-full py-3.5 text-[16px] font-bold inline-flex items-center justify-center gap-2" style={{ background: "linear-gradient(180deg,#f6d77d,#c9952f)", color: "#2a1450", boxShadow: "0 4px 12px #0004" }}><Play size={18} /> {t("audio.ouvir", "Ouvir agora")}</button>
      </Folha>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barra de navegação do livro:  ←  [Livro ▾]  [Capítulo ▾]  →          */
/* ------------------------------------------------------------------ */
export function BarraNavLivro({ book, chapter, setChapter, onTrocarLivro }) {
  useIdioma();
  const caps = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const seta = "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center focus:outline-none focus:ring-2 disabled:opacity-35";
  const sel = "w-full h-11 appearance-none rounded-xl pl-3 pr-8 text-[16px] font-semibold focus:outline-none focus:ring-2";
  const selEstilo = { background: "linear-gradient(180deg,#34197a,#1f0f4f)", border: "1.5px solid #CBA135", color: "#fff", fontFamily: serifa };
  return (
    <div className="flex items-center gap-2 rounded-2xl px-2 py-2" data-testid="barra-nav-livro" style={{ background: "linear-gradient(180deg,#2c1670,#1a0d42)", border: "1.5px solid #CBA135aa", boxShadow: "0 4px 14px #0008" }}>
      <button className={seta} disabled={!chapter || chapter <= 1} onClick={() => setChapter(chapter - 1)} aria-label={t("leitor.capAnterior", "Capítulo anterior")} data-testid="cap-anterior"><ChevronLeft size={26} color={V.ouro} /></button>
      <div className="relative flex-[1.6] min-w-0">
        <select value={book.abbr} onChange={(e) => onTrocarLivro(e.target.value)} aria-label={t("audio.livro", "Livro")} data-testid="nav-livro" className={sel} style={selEstilo}>
          <optgroup label={t("tes.at", "Antigo Testamento")}>{OLD_TESTAMENT.map((b) => <option key={b.abbr} value={b.abbr} style={{ color: "#000" }}>{nomeLivro(b)}</option>)}</optgroup>
          <optgroup label={t("tes.nt", "Novo Testamento")}>{NEW_TESTAMENT.map((b) => <option key={b.abbr} value={b.abbr} style={{ color: "#000" }}>{nomeLivro(b)}</option>)}</optgroup>
        </select>
        <ChevronDown size={16} color={V.ouro} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      <div className="relative flex-1 min-w-0">
        <select value={chapter || ""} onChange={(e) => setChapter(Number(e.target.value))} aria-label={t("audio.cap", "Capítulo")} data-testid="nav-capitulo" className={sel} style={selEstilo}>
          {!chapter && <option value="" style={{ color: "#000" }}>{t("leitor.capCurto", "Cap.")}</option>}
          {caps.map((n) => <option key={n} value={n} style={{ color: "#000" }}>{n}</option>)}
        </select>
        <ChevronDown size={16} color={V.ouro} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      <button className={seta} disabled={!!chapter && chapter >= book.chapters} onClick={() => setChapter(chapter ? chapter + 1 : 1)} aria-label={t("leitor.capProximo", "Próximo capítulo")} data-testid="cap-proximo"><ChevronRight size={26} color={V.ouro} /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Balão da abertura: aponta para o menu e já é o botão de Atualizar   */
/* ------------------------------------------------------------------ */
export function BalaoAtualizar({ estado, erro, baixar, aoFechar, topo = 112 }) {
  useIdioma();
  const [clicou, setClicou] = useState(false);
  useEffect(() => {
    if (!clicou || estado !== "pronto") return undefined;
    const id = setTimeout(aoFechar, 3200);
    return () => clearTimeout(id);
  }, [clicou, estado]);
  useEffect(() => {
    if (clicou) return undefined;
    const id = setTimeout(aoFechar, 25000);
    return () => clearTimeout(id);
  }, [clicou]);
  const baixando = clicou && estado === "baixando";
  const feito = clicou && estado === "pronto";
  const falhou = clicou && estado === "erro";
  return (
    <div className="fixed z-[55] left-3" style={{ top: topo, maxWidth: "min(310px, calc(100vw - 24px))" }} role="status" data-testid="balao-atualizar">
      <style>{"@keyframes balao-pulso{0%,100%{box-shadow:0 6px 22px #000a,0 0 0 0 #f6d77d99}50%{box-shadow:0 6px 22px #000a,0 0 0 7px #f6d77d00}}"}</style>
      <span aria-hidden="true" className="absolute block w-4 h-4 rotate-45" style={{ left: 22, top: -7, background: "#f6d77d", borderLeft: "1px solid #8B6F1F", borderTop: "1px solid #8B6F1F" }} />
      <div className="relative rounded-2xl pl-4 pr-9 py-3" style={{ background: "linear-gradient(180deg,#fbe7a0,#f0c65a)", border: "1.5px solid #8B6F1F", color: "#2a1450", animation: baixando || feito ? "none" : "balao-pulso 2.2s ease-in-out infinite" }}>
        <button onClick={() => { setClicou(true); baixar(); }} disabled={baixando} data-testid="balao-botao" className="text-left w-full focus:outline-none focus:ring-2 rounded disabled:opacity-80">
          {baixando ? (
            <span className="flex items-center gap-2 text-[14px] font-bold"><Loader2 size={16} className="animate-spin shrink-0" /> {t("balao.baixando", "Baixando a Bíblia… aguarde")}</span>
          ) : feito ? (
            <span className="flex items-center gap-2 text-[14px] font-bold"><CheckCircle2 size={17} className="shrink-0" color="#1f7a46" /> {t("balao.pronto", "Pronto! Agora você lê sem internet.")}</span>
          ) : falhou ? (
            <span className="block text-[13px] font-semibold leading-snug">{erro || t("balao.erro", "Não consegui baixar agora.")} <b>{t("balao.tentar", "Toque para tentar de novo.")}</b></span>
          ) : (
            <span className="block text-[14px] leading-snug"><b>{t("balao.linha1", "Clique no menu e em Atualizar.")}</b><br />{t("balao.linha2", "Leia sem precisar de internet.")}</span>
          )}
        </button>
        <button onClick={aoFechar} aria-label={t("menu.fechar", "Fechar")} data-testid="balao-fechar" className="absolute top-1.5 right-1.5 p-1.5 rounded-full focus:outline-none focus:ring-2"><X size={16} color="#5a3d00" /></button>
      </div>
    </div>
  );
}
