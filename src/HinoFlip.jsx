/* Hino em modo livro (flip): capa + uma estrofe por página, com virada de página em 3D.
   Interativo:
   - toque numa palavra sublinhada (ex.: "excelso") para ver o significado, como falar e de onde vem;
   - "Cantar junto": a linha atual se acende, no ritmo escolhido, e a página vira sozinha; toque numa linha para recomeçar dali;
   - música suave de fundo (a mesma do modo livro da Bíblia). */
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Music, VolumeX, Play, Square } from "lucide-react";
import { TextoComPalavras } from "./Leitor.jsx";
import { criarFundoSuave } from "./LivroFlip.jsx";
import { dividirEstrofes } from "./lib/hinos.js";

const OURO = "#E9C765";
const OURO_ESC = "#8a6a1f";
const TINTA = "#2B2216";
const TITULO = "'Playfair Display', Georgia, serif";
const PAPEL = "linear-gradient(90deg,#f1e4bf 0%,#fbf4de 8%,#fdf8e8 50%,#fbf4de 92%,#f1e4bf 100%)";
const PAPEL_ESQ = "linear-gradient(90deg,#f1e4bf 0%,#fbf4de 8%,#fdf8e8 55%,#f4e8c6 100%)";
const PAPEL_DIR = "linear-gradient(90deg,#f4e8c6 0%,#fdf8e8 45%,#fbf4de 92%,#f1e4bf 100%)";
const MS = 760;
const RITMOS = [["Devagar", 4200], ["Normal", 3000], ["Rápido", 2000]];

function Pagina({ pg, pw, ph, lado, num, ativa, aoLinha, aoPalavra }) {
  const base = { width: pw, height: ph, boxSizing: "border-box", position: "relative", overflow: "hidden", background: lado === "esq" ? PAPEL_ESQ : lado === "dir" ? PAPEL_DIR : PAPEL };
  if (!pg) return <div style={base} aria-hidden="true" />;
  if (pg.tipo === "capa") {
    return (
      <div style={{ ...base, background: "linear-gradient(160deg,#241a4a,#120a2e)", border: "5px double #CBA135", padding: "24px 20px", color: "#F3E6B8", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <p style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: "0.3em", color: OURO, margin: "0 0 12px" }}>HARPA CRISTÃ</p>
        <div style={{ fontFamily: TITULO, fontSize: 54, fontWeight: 700, color: "#F6D77D", lineHeight: 1 }}>{pg.numero}</div>
        <h1 style={{ fontFamily: TITULO, fontSize: Math.min(34, Math.max(22, pw / 12)), fontWeight: 700, color: "#F3E6B8", margin: "12px 0 0", lineHeight: 1.15 }}>{pg.titulo}</h1>
        {pg.credito && <p style={{ fontSize: 12.5, color: "#D9D2BE", marginTop: 14, lineHeight: 1.4 }}>{pg.credito}</p>}
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#ffffff80", marginTop: 18 }}>{pg.total} {pg.total === 1 ? "página" : "páginas"} · vire a página</p>
      </div>
    );
  }
  const fonte = Math.max(15, Math.min(24, Math.round(pw / (pg.maxCh > 34 ? 19 : 15.5))));
  return (
    <div style={{ ...base, padding: "26px 22px 36px", display: "flex", flexDirection: "column", justifyContent: "center", color: TINTA }}>
      <div style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: "0.25em", color: OURO_ESC, textAlign: "center", marginBottom: 12 }}>{pg.refrao ? "REFRÃO" : `ESTROFE ${pg.n}`}</div>
      <div style={pg.refrao ? { borderLeft: "3px solid #CBA135", paddingLeft: 14, fontStyle: "italic" } : {}}>
        {pg.linhas.map((l, j) => (
          <div key={j} data-linha={j} onClick={(e) => { if (aoLinha) aoLinha(j, e); }} style={{ fontFamily: TITULO, fontSize: fonte, lineHeight: 1.5, padding: "2px 6px", margin: "0 -6px", borderRadius: 6, cursor: aoLinha ? "pointer" : "default", background: ativa === j ? "linear-gradient(90deg,#f6d77d99,#f6d77d33)" : "transparent", boxShadow: ativa === j ? "inset 3px 0 0 #CBA135" : "none", transition: "background .25s" }}>
            <TextoComPalavras texto={l} chave={`l${pg.i}-${j}`} aoPalavra={aoPalavra} ativo={!!aoPalavra} />
          </div>
        ))}
      </div>
      <span style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontFamily: "monospace", fontSize: 11, color: OURO_ESC }}>{num}</span>
    </div>
  );
}

export default function HinoFlip({ hino, aoSair, aoPalavra }) {
  const palco = useRef(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState(0);
  const [flip, setFlip] = useState(null);
  const [musica, setMusica] = useState(() => { try { return localStorage.getItem("biblia:livro-musica") !== "0"; } catch (e) { return true; } });
  const [cantando, setCantando] = useState(false);
  const [ritmo, setRitmo] = useState(1);
  const [ponteiro, setPonteiro] = useState(0); // índice na lista de linhas visíveis
  const fundo = useRef(null);
  const timer = useRef(null);

  const paginas = useMemo(() => {
    const { estrofes, credito } = dividirEstrofes(hino.letra);
    const out = [{ tipo: "capa", numero: hino.numero, titulo: hino.titulo, credito, total: estrofes.length }];
    let n = 0;
    estrofes.forEach((e, k) => {
      if (!e.refrao) n += 1;
      out.push({ tipo: "estrofe", i: k, n, refrao: e.refrao, linhas: e.linhas, maxCh: Math.max(...e.linhas.map((l) => l.length)) });
    });
    return out;
  }, [hino]);
  const n = paginas.length;

  useLayoutEffect(() => {
    const el = palco.current;
    if (!el) return undefined;
    const med = () => setDim({ w: el.clientWidth, h: el.clientHeight });
    med();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(med); ro.observe(el); }
    window.addEventListener("resize", med);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", med); };
  }, []);
  const duplo = dim.w >= 860;
  const pw = Math.max(240, Math.floor(duplo ? Math.min(dim.w / 2 - 6, 440) : Math.min(dim.w - 6, 460)));
  const ph = Math.max(300, Math.floor(Math.min(dim.h - 6, 640)));
  const passo = duplo ? 2 : 1;
  const posMax = duplo ? (n % 2 === 1 ? n - 1 : n) : n - 1;
  // no modo duplo a capa fica sozinha na direita; garantir posição par
  useEffect(() => { setPos((p) => (duplo ? Math.min(p % 2 === 1 ? p + 1 : p, posMax) : Math.min(p, n - 1))); }, [duplo, n, posMax]);
  const podeProx = pos + passo <= posMax;
  const podeAnt = pos - passo >= 0;
  const P = (i) => (i >= 0 && i < n ? paginas[i] : null);

  const virar = useCallback((dir) => {
    if (flip) return;
    if (dir === "next" ? !podeProx : !podeAnt) return;
    const novo = dir === "next" ? pos + passo : pos - passo;
    setFlip(dir);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPos(novo); setFlip(null); setPonteiro(0); }, MS);
  }, [flip, podeProx, podeAnt, pos, passo]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const proxima = useCallback(() => virar("next"), [virar]);
  const anterior = useCallback(() => virar("prev"), [virar]);

  useEffect(() => {
    const k = (e) => { if (e.key === "ArrowRight") proxima(); else if (e.key === "ArrowLeft") anterior(); else if (e.key === "Escape") aoSair(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [proxima, anterior, aoSair]);

  // música
  useEffect(() => {
    if (!musica) { if (fundo.current) { fundo.current.parar(); fundo.current = null; } return; }
    if (!fundo.current) fundo.current = criarFundoSuave();
    if (fundo.current) fundo.current.iniciar();
  }, [musica]);
  useEffect(() => () => { if (fundo.current) { fundo.current.parar(); fundo.current = null; } }, []);
  useEffect(() => { if (fundo.current) fundo.current.nivel(cantando ? 0.32 : 0.5); }, [cantando]);
  const alternarMusica = () => setMusica((m) => { const v = !m; try { localStorage.setItem("biblia:livro-musica", v ? "1" : "0"); } catch (e) { /* ok */ } return v; });

  // linhas das páginas abertas (para o "Cantar junto")
  const abertas = duplo ? [pos - 1, pos] : [pos];
  const lista = [];
  abertas.forEach((i) => { const pg = P(i); if (pg && pg.tipo === "estrofe") pg.linhas.forEach((_, j) => lista.push([i, j])); });
  const alvo = lista[Math.min(ponteiro, Math.max(0, lista.length - 1))] || null;

  useEffect(() => {
    if (!cantando || flip) return undefined;
    if (!lista.length) { // capa: espera um pouco e passa
      const id = setTimeout(() => { if (podeProx) proxima(); else setCantando(false); }, 1600);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      if (ponteiro + 1 < lista.length) setPonteiro(ponteiro + 1);
      else if (podeProx) proxima();
      else setCantando(false);
    }, RITMOS[ritmo][1]);
    return () => clearTimeout(id);
  }, [cantando, flip, ponteiro, pos, ritmo, lista.length]); // eslint-disable-line

  const comecarDeLinha = (i, j) => {
    const idx = lista.findIndex(([a, b]) => a === i && b === j);
    if (idx >= 0) { setPonteiro(idx); setCantando(true); if (fundo.current) fundo.current.retomar(); }
  };

  const toque = useRef(null);
  const aoPressionar = (e) => { toque.current = { x: e.clientX, y: e.clientY }; if (fundo.current) fundo.current.retomar(); };
  const aoSoltar = (e) => {
    const t0 = toque.current; toque.current = null;
    if (!t0) return;
    const dx = e.clientX - t0.x, dy = e.clientY - t0.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { dx < 0 ? proxima() : anterior(); return; }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && !e.target.closest("[data-linha]") && !e.target.closest("[role=button]")) {
      const r = e.currentTarget.getBoundingClientRect();
      const f = (e.clientX - r.left) / r.width;
      if (f > 0.8) proxima(); else if (f < 0.2) anterior();
    }
  };

  const ativaDe = (i) => (cantando && alvo && alvo[0] === i ? alvo[1] : -1);
  const num = (i) => (i > 0 ? String(i) : "");
  const mk = (i, lado) => <Pagina key={"p" + i + lado} pg={P(i)} pw={pw} ph={ph} lado={lado} num={num(i)} ativa={ativaDe(i)} aoLinha={(j) => comecarDeLinha(i, j)} aoPalavra={aoPalavra} />;
  const branco = <div style={{ width: pw, height: ph, background: PAPEL }} aria-hidden="true" />;
  let baseEsq = null, baseDir = null, baseUni = null, folha = null;
  if (duplo) {
    baseEsq = mk(flip === "prev" ? pos - 3 : pos - 1, "esq");
    baseDir = mk(flip === "next" ? pos + 2 : pos, "dir");
    if (flip === "next") folha = { lado: "dir", frente: mk(pos, "dir"), verso: mk(pos + 1, "esq") };
    if (flip === "prev") folha = { lado: "esq", frente: mk(pos - 1, "esq"), verso: mk(pos - 2, "dir") };
  } else {
    baseUni = mk(flip === "next" ? pos + 1 : pos, "uni");
    if (flip) folha = { lado: "uni", frente: mk(flip === "next" ? pos : pos - 1, "uni"), verso: branco };
  }
  const anim = flip === "next" ? "hfNext" : flip === "prev" ? (duplo ? "hfPrevD" : "hfPrevS") : "none";
  const origem = flip === "prev" && duplo ? "right center" : "left center";
  const botao = { background: "transparent", border: "1px solid #CBA13566", color: OURO, borderRadius: 999, height: 34, minWidth: 34, padding: "0 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12.5, fontWeight: 700, cursor: "pointer" };

  return (
    <div data-testid="hino-flip" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at 50% 30%, #3a2470 0%, #1a0d42 60%, #0d0626 100%)" }}>
      <style>{`
        @keyframes hfNext { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
        @keyframes hfPrevD { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes hfPrevS { from { transform: rotateY(-180deg); } to { transform: rotateY(0deg); } }
        @keyframes hfSombra { 0% { opacity: 0; } 45% { opacity: .5; } 100% { opacity: 0; } }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", flexWrap: "wrap", justifyContent: "space-between", borderBottom: "1px solid #CBA13544", background: "#12082eCC" }}>
        <button onClick={aoSair} data-testid="hflip-sair" aria-label="Sair do modo livro" style={botao}><ArrowLeft size={16} /> Sair</button>
        <div style={{ color: "#F3E6B8", fontFamily: TITULO, fontWeight: 700, fontSize: 14, flex: 1, textAlign: "center", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hino.numero} · {hino.titulo}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setRitmo((r) => (r + 1) % RITMOS.length)} data-testid="hflip-ritmo" aria-label="Velocidade do cantar junto" style={botao}>{RITMOS[ritmo][0]}</button>
          <button onClick={() => { setCantando((c) => !c); if (fundo.current) fundo.current.retomar(); }} aria-pressed={cantando} data-testid="hflip-cantar" aria-label={cantando ? "Parar de cantar junto" : "Cantar junto"} style={{ ...botao, background: cantando ? "linear-gradient(180deg,#f6d77d,#c99530)" : "transparent", color: cantando ? "#1a0d42" : OURO }}>{cantando ? <Square size={14} /> : <Play size={14} />} Cantar junto</button>
          <button onClick={alternarMusica} aria-pressed={musica} aria-label={musica ? "Desligar a música de fundo" : "Ligar a música de fundo"} data-testid="hflip-musica" style={{ ...botao, background: musica ? "linear-gradient(180deg,#f6d77d,#c99530)" : "transparent", color: musica ? "#1a0d42" : OURO }}>{musica ? <Music size={16} /> : <VolumeX size={16} />}</button>
        </div>
      </div>
      <div ref={palco} style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
        {dim.w > 0 && (
          <div onPointerDown={aoPressionar} onPointerUp={aoSoltar} data-testid="hflip-livro" style={{ position: "relative", width: duplo ? pw * 2 : pw, height: ph, perspective: 2400, touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none", boxShadow: "0 18px 50px #000b, 0 0 0 1px #CBA13555", borderRadius: 6, background: PAPEL }}>
            {duplo ? (
              <>
                <div style={{ position: "absolute", left: 0, top: 0 }}>{baseEsq}</div>
                <div style={{ position: "absolute", left: pw, top: 0 }}>{baseDir}</div>
                <div aria-hidden="true" style={{ position: "absolute", left: pw - 9, top: 0, width: 18, height: ph, background: "linear-gradient(90deg, transparent, #00000030 50%, transparent)", pointerEvents: "none" }} />
              </>
            ) : <div style={{ position: "absolute", left: 0, top: 0 }}>{baseUni}</div>}
            {folha && (
              <div data-testid="hflip-folha" style={{ position: "absolute", top: 0, left: folha.lado === "dir" ? pw : 0, width: pw, height: ph, transformStyle: "preserve-3d", transformOrigin: origem, animation: `${anim} ${MS}ms cubic-bezier(.45,.05,.3,1) forwards`, willChange: "transform", zIndex: 5 }}>
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  {folha.frente}
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#00000055,#00000000)", animation: `hfSombra ${MS}ms ease-in-out forwards`, opacity: 0, pointerEvents: "none" }} />
                </div>
                <div style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  {folha.verso}
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg,#00000055,#00000000)", animation: `hfSombra ${MS}ms ease-in-out forwards`, opacity: 0, pointerEvents: "none" }} />
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={anterior} disabled={!podeAnt || !!flip} data-testid="hflip-anterior" aria-label="Página anterior" style={{ position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)", width: 36, height: 56, borderRadius: 10, border: "none", background: "#12082e88", color: OURO, cursor: "pointer", opacity: podeAnt ? 1 : 0, zIndex: 8 }}><ChevronLeft size={22} /></button>
        <button onClick={proxima} disabled={!podeProx || !!flip} data-testid="hflip-proxima" aria-label="Próxima página" style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", width: 36, height: 56, borderRadius: 10, border: "none", background: "#12082e88", color: OURO, cursor: "pointer", opacity: podeProx ? 1 : 0, zIndex: 8 }}><ChevronRight size={22} /></button>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: "#C9C2D8", padding: "4px 8px 8px", fontFamily: "monospace" }}>toque numa palavra com traço vermelho para ver o significado · toque numa linha para cantar dali</div>
    </div>
  );
}
