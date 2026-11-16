/* Modo "Ler como livro": páginas de verdade que viram (efeito flip 3D), com música suave de fundo.
   - Celular: uma página por vez. Computador/tablet largo: duas páginas abertas, como um livro.
   - O texto é dividido em páginas medindo o espaço disponível (não há rolagem dentro da página).
   - Os capítulos são carregados aos poucos (só o que está perto), então abre rápido e não trava.
   - Vira com toque nas bordas, deslize do dedo, setas do teclado ou os botões. */
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Music, VolumeX, Volume2, Square, Loader2 } from "lucide-react";

const OURO = "#E9C765";
const OURO_ESC = "#8a6a1f";
const TINTA = "#2B2620";
const SERIFA = "Georgia, 'Times New Roman', serif";
const TITULO = "'Playfair Display', Georgia, serif";
const PAPEL = "linear-gradient(90deg,#eadcb6 0%,#f7eed6 7%,#f9f2de 50%,#f7eed6 93%,#eadcb6 100%)";
const PAPEL_ESQ = "linear-gradient(90deg,#eadcb6 0%,#f7eed6 7%,#f9f2de 55%,#efe3c0 100%)";
const PAPEL_DIR = "linear-gradient(90deg,#efe3c0 0%,#f9f2de 45%,#f7eed6 93%,#eadcb6 100%)";
const PADX = 24;
const PADT = 26;
const PADB = 36;
const MS_VIRADA = 760;

/* -------------------------------------------------------------- */
/* Música de fundo: colchão de acordes lentos + dedilhado suave.   */
/* Tudo sintetizado no aparelho (sem arquivo), baixo volume.       */
/* -------------------------------------------------------------- */
export function criarFundoSuave() {
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 1500;
  const eco = ctx.createDelay(1.5);
  eco.delayTime.value = 0.5;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const molhado = ctx.createGain();
  molhado.gain.value = 0.4;
  master.connect(filtro);
  filtro.connect(ctx.destination);
  filtro.connect(eco);
  eco.connect(fb);
  fb.connect(eco);
  eco.connect(molhado);
  molhado.connect(ctx.destination);

  // Cmaj7 – Am7 – Fmaj7 – Gsus (graves e médios)
  const ACORDES = [
    [130.81, 196.0, 261.63, 329.63],
    [110.0, 164.81, 220.0, 261.63],
    [87.31, 130.81, 174.61, 261.63],
    [98.0, 146.83, 196.0, 220.0],
  ];
  const DUR = 7;
  let t0 = 0;
  let idx = 0;
  let timer = null;
  let parado = false;
  let nivel = 0.5;

  const pad = (f, t, dur) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 2.6);
    g.gain.setValueAtTime(0.05, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.4);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 2.5);
  };
  const dedilhado = (f, t) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 2.7);
  };
  const agendar = () => {
    if (parado) return;
    while (t0 < ctx.currentTime + 3) {
      const ac = ACORDES[idx % ACORDES.length];
      ac.forEach((f) => pad(f, t0, DUR));
      [0, 1, 2, 3, 2, 1].forEach((k, i) => dedilhado(ac[k] * 2, t0 + 1 + i * 1.0));
      t0 += DUR;
      idx += 1;
    }
  };
  return {
    iniciar() {
      if (parado) return;
      ctx.resume && ctx.resume();
      if (timer) return;
      t0 = ctx.currentTime + 0.1;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(nivel, ctx.currentTime + 3);
      agendar();
      timer = setInterval(agendar, 1000);
    },
    retomar() { ctx.resume && ctx.resume(); },
    nivel(v) {
      nivel = v;
      try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.6); } catch (e) { /* ok */ }
    },
    parar() {
      if (parado) return;
      parado = true;
      clearInterval(timer);
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        setTimeout(() => { try { ctx.close(); } catch (e) { /* ok */ } }, 1100);
      } catch (e) { /* ok */ }
    },
  };
}

/* -------------------------------------------------------------- */
/* Divide os versículos de um capítulo em páginas, medindo o texto */
/* -------------------------------------------------------------- */
function estiloTexto(fonte) {
  return { fontFamily: SERIFA, fontSize: fonte + "px", lineHeight: "1.55", color: TINTA };
}
function estiloCab(fonte) {
  return { fontFamily: TITULO, fontSize: Math.round(fonte * 1.55) + "px", fontWeight: "700", textAlign: "center", margin: "0 0 14px", lineHeight: "1.2" };
}
function paginarCapitulo(versos, cap, nome, largura, altura, fonte) {
  const m = document.createElement("div");
  Object.assign(m.style, { position: "fixed", left: "-10000px", top: "0", width: largura + "px", visibility: "hidden", boxSizing: "border-box" }, estiloTexto(fonte));
  document.body.appendChild(m);
  const paginas = [];
  let atual = [];
  const cabecalho = () => {
    const h = document.createElement("div");
    Object.assign(h.style, estiloCab(fonte));
    h.textContent = nome + " " + cap;
    m.appendChild(h);
  };
  cabecalho();
  versos.forEach((v) => {
    const p = document.createElement("p");
    p.style.margin = "0 0 7px";
    const sup = document.createElement("sup");
    sup.style.cssText = "font-size:.62em;margin-right:3px;font-family:monospace";
    sup.textContent = String(v.number);
    p.appendChild(sup);
    p.appendChild(document.createTextNode(v.text));
    m.appendChild(p);
    if (m.scrollHeight > altura && atual.length > 0) {
      m.removeChild(p);
      paginas.push({ tipo: "texto", cap, cab: paginas.length === 0, versos: atual });
      atual = [];
      m.innerHTML = "";
      m.appendChild(p);
    }
    atual.push(v);
  });
  if (atual.length) paginas.push({ tipo: "texto", cap, cab: paginas.length === 0, versos: atual });
  document.body.removeChild(m);
  return paginas;
}

/* -------------------------------------------------------------- */
/* Uma página                                                      */
/* -------------------------------------------------------------- */
function Pagina({ pg, pw, ph, fonte, nome, lado, numero, historia, marcasDe, Texto, total }) {
  const base = { width: pw, height: ph, boxSizing: "border-box", position: "relative", overflow: "hidden", background: lado === "esq" ? PAPEL_ESQ : lado === "dir" ? PAPEL_DIR : PAPEL };
  if (!pg) {
    return <div style={base} aria-hidden="true" />;
  }
  if (pg.tipo === "capa") {
    return (
      <div style={{ ...base, background: "linear-gradient(160deg,#241a4a,#120a2e)", border: "5px double #CBA135", padding: "28px 24px", color: "#F3E6B8", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <p style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: "0.3em", color: OURO, margin: "0 0 14px" }}>MINISTÉRIO AVIVAR DO ESPÍRITO</p>
        <h1 style={{ fontFamily: TITULO, fontSize: Math.min(40, Math.max(26, pw / 11)), fontWeight: 700, color: "#F6D77D", margin: "0 0 16px", lineHeight: 1.1 }}>{nome}</h1>
        {historia ? (
          <div style={{ textAlign: "left", fontSize: Math.max(12.5, fonte - 4), lineHeight: 1.5, color: "#E8E2D0", overflow: "hidden" }}>
            <p style={{ margin: "0 0 5px" }}><b style={{ color: OURO }}>Autor tradicional:</b> {historia.autor}</p>
            <p style={{ margin: "0 0 5px" }}><b style={{ color: OURO }}>Época:</b> {historia.epoca}</p>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: OURO }}>Tema:</b> {historia.tema}</p>
            <p style={{ margin: 0, color: "#D9D2BE" }}>{historia.texto && historia.texto.length > 420 ? historia.texto.slice(0, 417) + "…" : historia.texto}</p>
          </div>
        ) : null}
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#ffffff80", marginTop: 14 }}>{total} capítulos · vire a página</p>
      </div>
    );
  }
  if (pg.tipo === "fim") {
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, color: TINTA }}>
        <div style={{ fontFamily: TITULO, fontSize: 28, fontWeight: 700 }}>Fim de {nome}</div>
        <div style={{ width: 70, height: 2, background: "#CBA135", margin: "14px 0" }} />
        <div style={{ fontFamily: SERIFA, fontSize: 15, color: OURO_ESC }}>Bíblia Avivar</div>
      </div>
    );
  }
  return (
    <div style={{ ...base, padding: `${PADT}px ${PADX}px ${PADB}px`, ...estiloTexto(fonte) }}>
      {pg.cab && <div style={estiloCab(fonte)}>{nome} {pg.cap}</div>}
      {pg.versos.map((v) => {
        const mk = marcasDe ? (marcasDe(pg.cap) || {})[v.number] : null;
        return (
          <p key={v.number} style={{ margin: "0 0 7px" }} data-verso={v.number}>
            <sup style={{ fontSize: "0.62em", marginRight: 3, fontFamily: "monospace", color: OURO_ESC }}>{v.number}</sup>
            {Texto && mk && mk.length ? <Texto text={v.text} verseMarks={mk} onRemoveMark={() => {}} chave={"f" + pg.cap + "-" + v.number} /> : v.text}
          </p>
        );
      })}
      <span style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontFamily: "monospace", fontSize: 11, color: OURO_ESC }}>{numero}</span>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Leitor em livro                                                 */
/* -------------------------------------------------------------- */
export default function LivroFlip({ book, inicio, historia, carregar, marcasDe, Texto, aoSair, aoLer }) {
  const total = book.chapters;
  const primeiro = inicio && inicio > 1 ? Math.min(inicio, total) : 1;
  const [ordem, setOrdem] = useState({ a: primeiro, b: primeiro });
  const [versos, setVersos] = useState({}); // { cap: [{number,text}] }
  const [erro, setErro] = useState(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [fonte, setFonte] = useState(() => { try { const n = Number(localStorage.getItem("biblia:fonte-livro")); return n >= 13 && n <= 26 ? n : 17; } catch (e) { return 17; } });
  const [pos, setPos] = useState(0);
  const [flip, setFlip] = useState(null); // "next" | "prev"
  const [musica, setMusica] = useState(() => { try { return localStorage.getItem("biblia:livro-musica") !== "0"; } catch (e) { return true; } });
  const [lendo, setLendo] = useState(false);
  const palco = useRef(null);
  const ancora = useRef(primeiro > 1 ? { cap: primeiro, v: 1 } : { cap: 0, v: 1 });
  const carregando = useRef({});
  const cachePag = useRef({});
  const fundo = useRef(null);
  const exec = useRef(0);
  const reduzir = useMemo(() => { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }, []);

  /* ---- medidas ---- */
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
  const pw = Math.max(240, Math.floor(duplo ? Math.min(dim.w / 2 - 6, 440) : Math.min(dim.w - 6, 480)));
  const ph = Math.max(300, Math.floor(Math.min(dim.h - 6, 700)));
  const innerW = pw - PADX * 2;
  const innerH = ph - PADT - PADB;

  /* ---- carregar capítulos ---- */
  const ext = useRef({});
  ext.current = { carregar, aoLer, marcasDe };
  const buscar = useCallback((c, aoTerminar) => {
    if (c < 1 || c > total || carregando.current[c]) return;
    carregando.current[c] = true;
    ext.current.carregar(c)
      .then((d) => {
        const lista = (d && d.verses) || [];
        setVersos((prev) => ({ ...prev, [c]: lista }));
        if (ext.current.aoLer && lista.length) ext.current.aoLer(c, lista);
        if (aoTerminar) aoTerminar();
      })
      .catch(() => { carregando.current[c] = false; setErro(c); });
  }, [total]);
  useEffect(() => { buscar(primeiro); }, []); // eslint-disable-line

  /* ---- páginas (capa + capítulos + fim) ---- */
  const paginas = useMemo(() => {
    if (!innerW || !innerH || dim.w === 0) return [];
    const out = [];
    if (ordem.a === 1) out.push({ tipo: "capa" });
    for (let c = ordem.a; c <= ordem.b; c++) {
      const vs = versos[c];
      if (!vs) continue;
      const k = `${c}|${innerW}|${innerH}|${fonte}`;
      if (!cachePag.current[k]) cachePag.current[k] = paginarCapitulo(vs, c, book.name, innerW, innerH, fonte);
      out.push(...cachePag.current[k]);
    }
    if (ordem.b === total && versos[total]) out.push({ tipo: "fim" });
    return out;
  }, [versos, ordem, innerW, innerH, fonte, dim.w, book.name, total]);
  const n = paginas.length;
  const posMax = n % 2 === 1 ? n - 1 : n; // (duplo) maior posição par

  const indiceDaAncora = useCallback((lista) => {
    const a = ancora.current;
    if (a.cap === 0) return 0;
    const i = lista.findIndex((p) => p.tipo === "texto" && p.cap === a.cap && p.versos.some((v) => v.number >= a.v));
    if (i >= 0) return i;
    const j = lista.findIndex((p) => p.tipo === "texto" && p.cap === a.cap);
    return j >= 0 ? j : 0;
  }, []);
  const posDoIndice = useCallback((i, lista) => {
    if (!duplo) return Math.max(0, Math.min(i, lista.length - 1));
    const p = i % 2 === 1 ? i + 1 : i;
    return Math.max(0, Math.min(p, lista.length % 2 === 1 ? lista.length - 1 : lista.length));
  }, [duplo]);
  // Quando as páginas mudam (carregou capítulo, mudou o tamanho ou a letra), volta para o mesmo trecho
  useEffect(() => { if (n) setPos(posDoIndice(indiceDaAncora(paginas), paginas)); }, [paginas, duplo]); // eslint-disable-line
  const fixarAncora = (p) => {
    const pg = paginas[p] || paginas[p - 1];
    if (!pg) return;
    ancora.current = pg.tipo === "capa" ? { cap: 0, v: 1 } : pg.tipo === "fim" ? { cap: total, v: 9999 } : { cap: pg.cap, v: pg.versos[0].number };
  };

  /* ---- pré-carregar vizinhos ---- */
  useEffect(() => {
    if (!n) return;
    if (pos >= n - 3 && ordem.b < total && versos[ordem.b]) {
      const prox = ordem.b + 1;
      buscar(prox, () => setOrdem((o) => (o.b === prox - 1 ? { ...o, b: prox } : o)));
    }
    if (pos <= 2 && ordem.a > 1 && versos[ordem.a]) {
      const ant = ordem.a - 1;
      buscar(ant, () => setOrdem((o) => (o.a === ant + 1 ? { ...o, a: ant } : o)));
    }
  }, [pos, n, ordem, versos, total, buscar]);

  /* ---- virar página ---- */
  const passo = duplo ? 2 : 1;
  const podeProx = n > 0 && pos + passo <= (duplo ? posMax : n - 1) && !(!duplo && pos >= n - 1);
  const podeAnt = pos - passo >= 0 && !(duplo && pos - 1 < 0);
  const timer = useRef(null);
  const virar = useCallback((dir) => {
    if (flip) return;
    if (dir === "next" ? !podeProx : !podeAnt) return;
    const novo = dir === "next" ? pos + passo : pos - passo;
    if (reduzir) { setPos(novo); fixarAncora(novo); return; }
    setFlip(dir);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPos(novo); fixarAncora(novo); setFlip(null); }, MS_VIRADA);
  }, [flip, podeProx, podeAnt, pos, passo, reduzir, paginas]); // eslint-disable-line
  useEffect(() => () => clearTimeout(timer.current), []);
  const proxima = useCallback(() => virar("next"), [virar]);
  const anterior = useCallback(() => virar("prev"), [virar]);

  // pular para um capítulo
  const irParaCapitulo = (c) => {
    if (!c) return;
    ancora.current = { cap: c, v: 1 };
    if (c === 1 && ordem.a === 1 && versos[1]) { ancora.current = { cap: 0, v: 1 }; setPos(0); return; }
    if (c >= ordem.a && c <= ordem.b && versos[c]) { setPos(posDoIndice(indiceDaAncora(paginas), paginas)); return; }
    cachePag.current = {};
    setVersos((v) => ({ [c]: v[c] }));
    setOrdem({ a: c, b: c });
    carregando.current = { [c]: !!versos[c] };
    if (!versos[c]) buscar(c);
  };

  /* ---- teclado, toque e deslize ---- */
  useEffect(() => {
    const k = (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") proxima();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") anterior();
      else if (e.key === "Escape") aoSair();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [proxima, anterior, aoSair]);
  const toque = useRef(null);
  const aoPressionar = (e) => { toque.current = { x: e.clientX, y: e.clientY, t: Date.now() }; if (fundo.current) fundo.current.retomar(); };
  const aoSoltar = (e) => {
    const t0 = toque.current; toque.current = null;
    if (!t0) return;
    const dx = e.clientX - t0.x, dy = e.clientY - t0.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { dx < 0 ? proxima() : anterior(); return; }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const r = e.currentTarget.getBoundingClientRect();
      const f = (e.clientX - r.left) / r.width;
      if (f > 0.55) proxima(); else if (f < 0.45) anterior();
    }
  };

  /* ---- música ---- */
  useEffect(() => {
    if (!musica) { if (fundo.current) { fundo.current.parar(); fundo.current = null; } return undefined; }
    if (!fundo.current) fundo.current = criarFundoSuave();
    if (fundo.current) fundo.current.iniciar();
    return undefined;
  }, [musica]);
  useEffect(() => () => { if (fundo.current) { fundo.current.parar(); fundo.current = null; } }, []);
  useEffect(() => { if (fundo.current) fundo.current.nivel(lendo ? 0.18 : 0.5); }, [lendo]);
  const alternarMusica = () => setMusica((m) => { const v = !m; try { localStorage.setItem("biblia:livro-musica", v ? "1" : "0"); } catch (e) { /* ok */ } return v; });

  /* ---- ouvir as páginas abertas e virar sozinho ---- */
  const visiveis = duplo ? [paginas[pos - 1], paginas[pos]] : [paginas[pos]];
  useEffect(() => {
    const ss = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!lendo || flip || !ss || !n) return undefined;
    const meu = ++exec.current;
    ss.cancel();
    const lista = [];
    visiveis.forEach((pg) => { if (pg && pg.tipo === "texto") pg.versos.forEach((v) => lista.push(`${v.number}. ${v.text}`)); });
    const voz = ss.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
    const falar = (i) => {
      if (meu !== exec.current) return;
      if (i >= lista.length) { if (podeProx) proxima(); else setLendo(false); return; }
      const u = new SpeechSynthesisUtterance(lista[i]);
      u.lang = "pt-BR"; if (voz) u.voice = voz; u.rate = 0.95;
      u.onend = () => { if (meu === exec.current) falar(i + 1); };
      u.onerror = () => { if (meu === exec.current) setLendo(false); };
      ss.speak(u);
    };
    if (!lista.length) { if (podeProx) { const id = setTimeout(() => { if (meu === exec.current) proxima(); }, 400); return () => clearTimeout(id); } setLendo(false); return undefined; }
    falar(0);
    return () => { exec.current++; ss.cancel(); };
  }, [lendo, pos, flip, n]); // eslint-disable-line
  useEffect(() => () => { exec.current++; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ok */ } }, []);

  /* ---- o que mostrar em cada lugar ---- */
  const P = (i) => (i >= 0 && i < n ? paginas[i] : null);
  const num = (i) => { // número da página dentro do capítulo (só aparece se o capítulo tem mais de uma página)
    const pg = P(i);
    if (!pg || pg.tipo !== "texto") return "";
    let k = 1, j = i - 1;
    while (j >= 0 && paginas[j].tipo === "texto" && paginas[j].cap === pg.cap) { k++; j--; }
    const mais = (i + 1 < n && paginas[i + 1].tipo === "texto" && paginas[i + 1].cap === pg.cap) || k > 1;
    return mais ? String(k) : "";
  };
  const comum = { pw, ph, fonte, nome: book.name, historia, marcasDe, Texto, total };
  const pagina = (i, lado) => <Pagina key={"p" + i + lado} pg={P(i)} lado={lado} numero={num(i)} {...comum} />;
  const branco = <div style={{ width: pw, height: ph, background: PAPEL }} aria-hidden="true" />;

  let baseEsq = null, baseDir = null, baseUnica = null, folha = null;
  if (duplo) {
    baseEsq = pagina(flip === "prev" ? pos - 3 : pos - 1, "esq");
    baseDir = pagina(flip === "next" ? pos + 2 : pos, "dir");
    if (flip === "next") folha = { lado: "dir", frente: pagina(pos, "dir"), verso: pagina(pos + 1, "esq") };
    if (flip === "prev") folha = { lado: "esq", frente: pagina(pos - 1, "esq"), verso: pagina(pos - 2, "dir") };
  } else {
    baseUnica = pagina(flip === "next" ? pos + 1 : pos, "uni");
    if (flip === "next") folha = { lado: "uni", frente: pagina(pos, "uni"), verso: branco };
    if (flip === "prev") folha = { lado: "uni", frente: pagina(pos - 1, "uni"), verso: branco };
  }
  const larguraLivro = duplo ? pw * 2 : pw;
  const cap = (() => { const pg = P(pos) || P(pos - 1); return pg && pg.tipo === "texto" ? pg.cap : pg && pg.tipo === "fim" ? total : 0; })();
  const anim = flip === "next" ? "lfNext" : flip === "prev" ? (duplo ? "lfPrevD" : "lfPrevS") : "none";
  const origem = flip === "prev" && duplo ? "right center" : "left center";
  const botao = { background: "transparent", border: "1px solid #CBA13566", color: OURO, borderRadius: 999, height: 34, minWidth: 34, padding: "0 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12.5, fontWeight: 700, cursor: "pointer" };

  return (
    <div data-testid="livro-flip" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at 50% 30%, #3a2470 0%, #1a0d42 60%, #0d0626 100%)" }}>
      <style>{`
        @keyframes lfNext { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
        @keyframes lfPrevD { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes lfPrevS { from { transform: rotateY(-180deg); } to { transform: rotateY(0deg); } }
        @keyframes lfSombra { 0% { opacity: 0; } 45% { opacity: .5; } 100% { opacity: 0; } }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", flexWrap: "wrap", justifyContent: "space-between", borderBottom: "1px solid #CBA13544", background: "#12082eCC" }}>
        <button onClick={aoSair} data-testid="flip-sair" aria-label="Sair do modo livro" style={botao}><ArrowLeft size={16} /> Sair</button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F3E6B8", fontFamily: TITULO, fontWeight: 700, fontSize: 14 }}>
          <span>{book.name}</span>
          <select value={cap || ""} onChange={(e) => irParaCapitulo(Number(e.target.value))} data-testid="flip-capitulo" aria-label="Ir para o capítulo" style={{ background: "#2c1670", color: "#F3E6B8", border: "1px solid #CBA13588", borderRadius: 8, height: 30, fontSize: 13 }}>
            {cap === 0 && <option value="">Capa</option>}
            {Array.from({ length: total }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Cap. {c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setFonte((f) => { const v = Math.max(13, f - 1); try { localStorage.setItem("biblia:fonte-livro", String(v)); } catch (e) { /* ok */ } return v; })} aria-label="Diminuir a letra" data-testid="flip-fonte-menos" style={botao}>A−</button>
          <button onClick={() => setFonte((f) => { const v = Math.min(26, f + 1); try { localStorage.setItem("biblia:fonte-livro", String(v)); } catch (e) { /* ok */ } return v; })} aria-label="Aumentar a letra" data-testid="flip-fonte-mais" style={botao}>A+</button>
          <button onClick={alternarMusica} aria-pressed={musica} aria-label={musica ? "Desligar a música de fundo" : "Ligar a música de fundo"} data-testid="flip-musica" style={{ ...botao, background: musica ? "linear-gradient(180deg,#f6d77d,#c99530)" : "transparent", color: musica ? "#1a0d42" : OURO }}>{musica ? <Music size={16} /> : <VolumeX size={16} />}</button>
          <button onClick={() => setLendo((l) => !l)} aria-pressed={lendo} aria-label={lendo ? "Parar a leitura em voz" : "Ouvir as páginas"} data-testid="flip-ouvir" style={{ ...botao, color: lendo ? "#ff8a80" : OURO }}>{lendo ? <Square size={15} /> : <Volume2 size={16} />}</button>
        </div>
      </div>

      <div ref={palco} style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
        {n === 0 ? (
          <div style={{ color: "#F3E6B8", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }} data-testid="flip-carregando">
            {erro ? <span>Não foi possível carregar este capítulo agora. Confira a internet. <button onClick={() => { setErro(null); buscar(erro); }} style={{ ...botao, marginLeft: 6 }}>Tentar de novo</button></span> : <><Loader2 size={16} className="animate-spin" /> Preparando o livro…</>}
          </div>
        ) : (
          <div onPointerDown={aoPressionar} onPointerUp={aoSoltar} data-testid="flip-livro" style={{ position: "relative", width: larguraLivro, height: ph, perspective: 2400, touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none", boxShadow: "0 18px 50px #000b, 0 0 0 1px #CBA13555", borderRadius: 6, background: PAPEL }}>
            {duplo ? (
              <>
                <div style={{ position: "absolute", left: 0, top: 0 }}>{baseEsq}</div>
                <div style={{ position: "absolute", left: pw, top: 0 }}>{baseDir}</div>
                <div aria-hidden="true" style={{ position: "absolute", left: pw - 9, top: 0, width: 18, height: ph, background: "linear-gradient(90deg, transparent, #00000030 50%, transparent)", pointerEvents: "none" }} />
              </>
            ) : (
              <div style={{ position: "absolute", left: 0, top: 0 }}>{baseUnica}</div>
            )}
            {folha && (
              <div data-testid="flip-folha" style={{ position: "absolute", top: 0, left: folha.lado === "dir" ? pw : 0, width: pw, height: ph, transformStyle: "preserve-3d", transformOrigin: origem, animation: `${anim} ${MS_VIRADA}ms cubic-bezier(.45,.05,.3,1) forwards`, willChange: "transform", zIndex: 5 }}>
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  {folha.frente}
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#00000055,#00000000)", animation: `lfSombra ${MS_VIRADA}ms ease-in-out forwards`, opacity: 0, pointerEvents: "none" }} />
                </div>
                <div style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  {folha.verso}
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg,#00000055,#00000000)", animation: `lfSombra ${MS_VIRADA}ms ease-in-out forwards`, opacity: 0, pointerEvents: "none" }} />
                </div>
              </div>
            )}
          </div>
        )}
        {n > 0 && (
          <>
            <button onClick={anterior} disabled={!podeAnt || !!flip} data-testid="flip-anterior" aria-label="Página anterior" style={{ position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)", width: 36, height: 56, borderRadius: 10, border: "none", background: "#12082e88", color: OURO, cursor: "pointer", opacity: podeAnt ? 1 : 0, zIndex: 8 }}><ChevronLeft size={22} /></button>
            <button onClick={proxima} disabled={!podeProx || !!flip} data-testid="flip-proxima" aria-label="Próxima página" style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", width: 36, height: 56, borderRadius: 10, border: "none", background: "#12082e88", color: OURO, cursor: "pointer", opacity: podeProx ? 1 : 0, zIndex: 8 }}><ChevronRight size={22} /></button>
          </>
        )}
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: "#C9C2D8", padding: "4px 0 8px", fontFamily: "monospace" }}>toque nas bordas, deslize ou use as setas para virar a página</div>
    </div>
  );
}
