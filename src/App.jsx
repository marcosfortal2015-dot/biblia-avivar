import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Menu, X, Lock, ShieldCheck, ChevronLeft, ChevronRight, ArrowLeft,
  BookOpen, Search, Image as ImageIcon, Loader2, AlertCircle,
  Highlighter, Share2, Download, Music, Play, Pause, StickyNote, Trash2, Plus, Volume2, Square,
  GraduationCap, CalendarDays, HandHeart, ExternalLink,
  Sparkles, WifiOff, CheckCircle2, VolumeX, Link2, Smartphone, MessageCircle, FileText,
} from "lucide-react";
import { storageGet, storageSet, privateLogin, privateLogout } from "./lib/storage.js";
import { OLD_TESTAMENT, NEW_TESTAMENT, ALL_BOOKS, findBook } from "./lib/bibleData.js";
import { SEED_STUDIES } from "./lib/seedStudies.js";
import { BOOK_HISTORY } from "./lib/bookHistory.js";

/* ---------------------------------------------------------------- */
/* Tokens — mesma identidade preto e dourado do site principal       */
/* ---------------------------------------------------------------- */
const C = {
  ink: "#1F1B2E",
  parchment: "#FBF6ED",
  cream: "#FFFDF8",
  gold: "#CBA135",
  goldBright: "#E9C765",
  goldDeep: "#8B6F1F",
  black: "#0B0B0C",
  blackSoft: "#1A1A1D",
  stone: "#8A8272",
  line: "#00000018",
};

const uid = () => Math.random().toString(36).slice(2, 10);

// Foto do hero da Home (nascer do sol com a Bíblia aberta) — arquivo em public/
const BIBLIA_HERO_IMG = "/2-biblia-hero-amanhecer.jpg";

// ---- Configuração da API bíblica ----------------------------------
const BIBLE_API_BASE = "https://www.abibliadigital.com.br/api";
const BIBLE_API_TOKEN = ""; // <-- cole seu token gratuito aqui (opcional, plano B)
const BIBLE_VERSION = "nvi";

// A senha do administrador não fica mais no código: é conferida no servidor (api/privado.js do site do Ministério).

const inputCls = "w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2";

/* ---------------------------------------------------------------- */
/* Dados compartilhados (Supabase) — estudos, configuração de música */
/* ---------------------------------------------------------------- */
async function loadKey(key, fallback) {
  try {
    const res = await storageGet(key);
    if (res && res.value !== undefined && res.value !== null) {
      return typeof res.value === "string" ? JSON.parse(res.value) : res.value;
    }
  } catch (e) {}
  return fallback;
}
async function saveKey(key, value) {
  try {
    await storageSet(key, value);
  } catch (e) {
    console.error("Falha ao salvar", key, e);
  }
}

/* ---------------------------------------------------------------- */
/* Dados pessoais (localStorage do aparelho) — marcações, anotações,  */
/* preferência de música. Ficam só no dispositivo do leitor de       */
/* propósito — são marcas pessoais, não conteúdo do ministério.      */
/* ---------------------------------------------------------------- */
function loadMarksLocal(bookAbbr, chapter) {
  try {
    const raw = window.localStorage.getItem(`biblia:marcas:${bookAbbr}:${chapter}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveMarksLocal(bookAbbr, chapter, marks) {
  try {
    window.localStorage.setItem(`biblia:marcas:${bookAbbr}:${chapter}`, JSON.stringify(marks));
  } catch (e) {}
}
function loadNotesLocal() {
  try {
    const raw = window.localStorage.getItem("biblia:anotacoes");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveNotesLocal(list) {
  try {
    window.localStorage.setItem("biblia:anotacoes", JSON.stringify(list));
  } catch (e) {}
}
function loadMusicPrefLocal() {
  try {
    const raw = window.localStorage.getItem("biblia:musicaPref");
    return raw ? JSON.parse(raw) : { track: "", volume: 0.4 };
  } catch (e) {
    return { track: "", volume: 0.4 };
  }
}
function saveMusicPrefLocal(pref) {
  try {
    window.localStorage.setItem("biblia:musicaPref", JSON.stringify(pref));
  } catch (e) {}
}

// "Continue sua leitura" (Home) — guarda o último capítulo aberto, só neste
// aparelho (mesmo padrão de marcas/anotações/música acima). Atualizado toda
// vez que um capítulo carrega com sucesso, em ReadTab e no modo livro.
function loadUltimaLeituraLocal() {
  try {
    const raw = window.localStorage.getItem("biblia:ultimaLeitura");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function saveUltimaLeituraLocal(book, chapter, verses) {
  try {
    window.localStorage.setItem(
      "biblia:ultimaLeitura",
      JSON.stringify({
        abbr: book.abbr,
        nome: book.name,
        totalCapitulos: book.chapters,
        capitulo: chapter,
        totalVersiculos: (verses || []).length,
        primeiraLinha: (verses && verses[0] && verses[0].text) || "",
        ts: Date.now(),
      })
    );
  } catch (e) {}
}

/* ---------------------------------------------------------------- */
/* Exportar em PDF — abre janela de impressão do navegador           */
/* (usuário escolhe "Salvar como PDF" no destino), sem depender de    */
/* nenhuma biblioteca nova.                                           */
/* ---------------------------------------------------------------- */
function printPage(title, bodyHtml) {
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><meta charset="utf-8" />
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; padding: 28px; color: #1F1B2E; line-height: 1.6; }
      h1 { font-size: 20px; border-bottom: 2px solid #CBA135; padding-bottom: 8px; margin-bottom: 16px; }
      .verso { margin-bottom: 6px; }
      .num { font-family: monospace; font-size: 11px; color: #8B6F1F; margin-right: 4px; vertical-align: super; }
      .nota { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ccc; }
      .ref { font-weight: bold; color: #8B6F1F; }
      @media print { body { padding: 0; } }
    </style>
    </head><body>
      <h1>${title}</h1>
      ${bodyHtml}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/* ---------------------------------------------------------------- */
/* Cartão evangelístico do versículo — gerado na hora, no navegador,  */
/* desenhando texto sobre a imagem de fundo (Canvas nativo, sem       */
/* biblioteca nenhuma).                                                */
/* ---------------------------------------------------------------- */
const CARD_BACKGROUNDS = [
  "/versiculo-cartao-fundo.png",
  "/versiculo-cartao-fundo-2.png",
  "/versiculo-cartao-fundo-3.png",
  "/versiculo-cartao-fundo-4.png",
  "/versiculo-cartao-fundo-5.png",
  "/versiculo-cartao-fundo-6.png",
  "/versiculo-cartao-fundo-7.png",
];
const CARD_OPENING_PHRASES = [
  "Você é muito importante para Deus.",
  "Deus está cuidando de você.",
  "Deus pensa em você, agora mesmo.",
  "Você não está sozinho — Deus está com você.",
  "Há um propósito de Deus na sua vida.",
];
const CARD_FOOTER = "Visite o Avivar do Espírito em www.avivardoespirito.com.br";

function wrapCanvasLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ---------------------------------------------------------------- */
/* Cartão do versículo — arte PEQUENA no topo e fundo em COR. Se o   */
/* texto for grande, o cartão cresce e a cor preenche o espaço.       */
/* ---------------------------------------------------------------- */
const CARD_PALETTES = [
  ["#1B1035", "#3A1B63"], // violeta
  ["#0B2545", "#13497A"], // azul
  ["#3B0D1E", "#7A1F3D"], // vinho
  ["#0F3B2E", "#1E6B52"], // verde
  ["#2B1B0B", "#7A5412"], // âmbar escuro
  ["#10282F", "#1B6A78"], // petróleo
];
const hashStr = (s) => String(s || "").split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function generateVerseCard(verseText, reference) {
  return new Promise((resolve, reject) => {
    const W = 1080;
    const MARGIN = 90;
    const IMG_H = 300; // a arte agora é só uma faixa no topo (antes ocupava o cartão inteiro)
    const palette = CARD_PALETTES[hashStr(reference) % CARD_PALETTES.length];
    const phrase = CARD_OPENING_PHRASES[Math.floor(Math.random() * CARD_OPENING_PHRASES.length)];

    // 1) mede o texto numa tela provisória para saber a altura que o cartão precisa ter
    const meas = document.createElement("canvas").getContext("2d");
    const layout = (verseSize) => {
      const verseLH = Math.round(verseSize * 1.32);
      meas.font = "italic 32px Georgia";
      const phraseLines = wrapCanvasLines(meas, phrase, 780);
      meas.font = `${verseSize}px Georgia`;
      const verseLines = wrapCanvasLines(meas, `"${verseText}"`, W - MARGIN * 2 - 20);
      const textH = phraseLines.length * 44 + 36 + verseLines.length * verseLH + 30 + 40;
      return { verseSize, verseLH, phraseLines, verseLines, textH };
    };
    let L = layout(40);
    for (const s of [36, 32, 28, 26]) {
      if (MARGIN + IMG_H + 70 + L.textH + 130 <= 1920) break;
      L = layout(s);
    }
    const H = Math.min(1920, Math.max(1080, MARGIN + IMG_H + 70 + L.textH + 130));

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    const finish = (img) => {
      // 2) fundo em cor (gradiente) preenchendo tudo
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, palette[1]);
      g.addColorStop(1, palette[0]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W / 2, MARGIN + IMG_H, 40, W / 2, MARGIN + IMG_H, W * 0.8);
      glow.addColorStop(0, "rgba(233,199,101,0.20)");
      glow.addColorStop(1, "rgba(233,199,101,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // 3) moldura fina dourada
      ctx.strokeStyle = "rgba(203,161,53,0.55)";
      ctx.lineWidth = 3;
      roundRectPath(ctx, 28, 28, W - 56, H - 56, 26);
      ctx.stroke();

      // 4) arte pequena, no topo, com cantos arredondados
      if (img) {
        ctx.save();
        roundRectPath(ctx, MARGIN, MARGIN, W - MARGIN * 2, IMG_H, 22);
        ctx.clip();
        drawImageCover(ctx, img, MARGIN, MARGIN, W - MARGIN * 2, IMG_H);
        ctx.restore();
        ctx.strokeStyle = "#CBA135";
        ctx.lineWidth = 3;
        roundRectPath(ctx, MARGIN, MARGIN, W - MARGIN * 2, IMG_H, 22);
        ctx.stroke();
      }

      // 5) texto centralizado no espaço que sobra abaixo da arte
      const areaTop = MARGIN + IMG_H + 40;
      const areaBottom = H - 110;
      let curY = areaTop + Math.max(0, (areaBottom - areaTop - L.textH) / 2) + 40;
      ctx.textAlign = "center";
      ctx.font = "italic 32px Georgia";
      ctx.fillStyle = "#E9C765";
      L.phraseLines.forEach((l) => {
        ctx.fillText(l, W / 2, curY);
        curY += 44;
      });
      curY += 36;
      ctx.font = `${L.verseSize}px Georgia`;
      ctx.fillStyle = "#FBF6ED";
      L.verseLines.forEach((l) => {
        ctx.fillText(l, W / 2, curY);
        curY += L.verseLH;
      });
      curY += 30;
      ctx.font = "bold 30px Georgia";
      ctx.fillStyle = "#E9C765";
      ctx.fillText(reference, W / 2, curY);

      ctx.font = "20px Georgia";
      ctx.fillStyle = "#D9CBA0";
      ctx.fillText(CARD_FOOTER, W / 2, H - 62);

      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))), "image/png");
    };
    bgImg.onload = () => finish(bgImg);
    bgImg.onerror = () => finish(null); // sem a arte, o cartão sai só com o fundo em cor
    bgImg.src = CARD_BACKGROUNDS[Math.floor(Math.random() * CARD_BACKGROUNDS.length)];
  });
}

/* ---------------------------------------------------------------- */
/* Link de mensagem — quem recebe abre uma tela com efeito e música   */
/* (harpa sintetizada no próprio aparelho, sem arquivo de áudio).     */
/* ---------------------------------------------------------------- */
const b64enc = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64dec = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

function buildShareLink({ ref, text, abbr, chapter, verse }) {
  const p = b64enc(JSON.stringify({ r: ref, t: text, a: abbr, c: chapter, v: verse }));
  return `${window.location.origin}/api/m?m=${p}`; // a função /api/m devolve a prévia (título e texto) e leva ao app
}
function readShareParam() {
  try {
    const m = new URLSearchParams(window.location.search).get("m");
    if (!m) return null;
    const o = JSON.parse(b64dec(m));
    return o && o.t ? o : null;
  } catch (e) {
    return null;
  }
}

// Harpa de brinquedo: notas "dedilhadas" (onda triangular + harmônico, com eco) em arpejos C – Am – F – G.
function createHarpPlayer() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.3;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  master.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(ctx.destination);

  const CHORDS = [
    [261.63, 329.63, 392.0, 523.25], // C
    [220.0, 261.63, 329.63, 440.0], // Am
    [174.61, 261.63, 349.23, 440.0], // F
    [196.0, 293.66, 392.0, 493.88], // G
  ];
  const PATTERN = [0, 1, 2, 3, 2, 1];
  const STEP = 0.4;
  let step = 0;
  let nextTime = 0;
  let timer = null;
  let stopped = false;

  const pluck = (freq, t, vel) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 3400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(f);
    o2.connect(g2);
    g2.connect(f);
    f.connect(g);
    g.connect(master);
    o.start(t);
    o2.start(t);
    o.stop(t + 2.5);
    o2.stop(t + 2.5);
  };

  const schedule = () => {
    if (stopped) return;
    while (nextTime < ctx.currentTime + 0.8) {
      const chord = CHORDS[Math.floor(step / (PATTERN.length * 2)) % CHORDS.length];
      const note = chord[PATTERN[step % PATTERN.length]];
      pluck(note, nextTime, step % PATTERN.length === 0 ? 0.32 : 0.22);
      if (step % PATTERN.length === 0) pluck(chord[0] / 2, nextTime, 0.2); // baixo no início de cada arpejo
      nextTime += STEP;
      step += 1;
    }
  };

  return {
    start() {
      ctx.resume && ctx.resume();
      nextTime = ctx.currentTime + 0.15;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);
      schedule();
      timer = setInterval(schedule, 250);
      // some devagar depois de ~50s, para não ficar tocando pra sempre
      setTimeout(() => this.stop(), 50000);
    },
    setMuted(m) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(m ? 0 : 0.55, ctx.currentTime + 0.4);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => ctx.close && ctx.close().catch(() => {}), 1300);
      } catch (e) {}
    },
  };
}

function ReceberMensagem({ msg, onEnter, onOpenChapter }) {
  const [aberta, setAberta] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [lendo, setLendo] = useState(false);
  const harpRef = useRef(null);
  const palette = CARD_PALETTES[hashStr(msg.r) % CARD_PALETTES.length];
  const words = String(msg.t || "").split(" ");

  useEffect(
    () => () => {
      if (harpRef.current) harpRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
    []
  );

  const abrir = () => {
    setAberta(true);
    try {
      harpRef.current = createHarpPlayer();
      if (harpRef.current) harpRef.current.start();
    } catch (e) {}
  };
  const alternarSom = () => {
    const novo = !mudo;
    setMudo(novo);
    if (harpRef.current) harpRef.current.setMuted(novo);
  };
  const ouvir = () => {
    if (!window.speechSynthesis) return;
    if (lendo) {
      window.speechSynthesis.cancel();
      setLendo(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${msg.t}. ${msg.r}`);
    u.lang = "pt-BR";
    const pt = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
    if (pt) u.voice = pt;
    u.rate = 0.9;
    u.onend = () => setLendo(false);
    u.onerror = () => setLendo(false);
    setLendo(true);
    window.speechSynthesis.speak(u);
  };

  const particulas = Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37 + 11) % 100,
    size: 4 + ((i * 7) % 9),
    dur: 7 + ((i * 5) % 9),
    delay: -((i * 3) % 11),
  }));

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: `radial-gradient(ellipse at 50% 30%, ${palette[1]} 0%, ${palette[0]} 70%)`, color: "#FBF6ED" }}>
      <style>{`
        @keyframes rcvFloat { 0% { transform: translateY(0) scale(.6); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(-115vh) scale(1.1); opacity: 0; } }
        @keyframes rcvWord { from { opacity: 0; filter: blur(8px); transform: translateY(10px); } to { opacity: 1; filter: blur(0); transform: none; } }
        @keyframes rcvSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes rcvPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(233,199,101,.55); } 50% { transform: scale(1.05); box-shadow: 0 0 0 18px rgba(233,199,101,0); } }
        @keyframes rcvIn { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }
        .rcv-part { position: absolute; bottom: -20px; border-radius: 9999px; background: radial-gradient(circle, #FFF3C4 0%, #E9C765 55%, rgba(233,199,101,0) 70%); animation: rcvFloat linear infinite; pointer-events: none; }
        .rcv-rays { position: absolute; left: 50%; top: 34%; width: 150vmax; height: 150vmax; background: repeating-conic-gradient(from 0deg, rgba(233,199,101,.11) 0deg 6deg, rgba(233,199,101,0) 6deg 18deg); animation: rcvSpin 90s linear infinite; pointer-events: none; -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 55%); mask-image: radial-gradient(circle, #000 0%, transparent 55%); }
        .rcv-word { display: inline-block; opacity: 0; animation: rcvWord .9s ease-out forwards; }
        .rcv-pulse { animation: rcvPulse 1.8s ease-in-out infinite; }
        .rcv-in { animation: rcvIn .8s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rcv-part, .rcv-rays, .rcv-pulse { animation: none; } .rcv-word { animation-duration: .01s; animation-delay: 0s !important; } }
      `}</style>
      <div className="rcv-rays" />
      {particulas.map((p, i) => (
        <span key={i} className="rcv-part" style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
      ))}

      <div className="relative min-h-full flex flex-col items-center justify-center text-center px-6 py-10 max-w-xl mx-auto">
        <img src="/logo-icone.png" alt="Bíblia Avivar" className="h-14 w-auto mb-5 rcv-in" />

        {!aberta ? (
          <div className="rcv-in flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(233,199,101,.14)", border: "1px solid #E9C76588" }}>
              <Sparkles size={42} color="#E9C765" />
            </div>
            <p className="text-xs font-mono uppercase tracking-[0.25em]" style={{ color: "#E9C765" }}>Bíblia Avivar</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Você recebeu uma mensagem</h1>
            <p className="text-sm mt-3 max-w-xs" style={{ color: "#D9D2E6" }}>Alguém lembrou de você e quis lhe entregar uma palavra de Deus.</p>
            <button onClick={abrir} className="rcv-pulse mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold focus:outline-none focus:ring-2" style={{ background: "linear-gradient(135deg,#F3D77C,#CBA135)", color: "#2A1B00" }}>
              <Music size={18} /> Toque para abrir
            </button>
            <p className="text-[11px] mt-3" style={{ color: "#B9B0CC" }}>Ligue o som do celular 🎵</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <p className="text-xs font-mono uppercase tracking-[0.25em] rcv-in" style={{ color: "#E9C765" }}>Uma palavra para você</p>
            <div className="w-14 h-px my-4" style={{ background: "#E9C765" }} />
            <p className="font-display text-2xl sm:text-3xl leading-snug" style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 18px rgba(0,0,0,.35)" }}>
              <span aria-hidden="true">“</span>
              {words.map((w, i) => (
                <span key={i} className="rcv-word" style={{ animationDelay: `${0.5 + Math.min(i, 60) * 0.11}s` }}>{w}{i < words.length - 1 ? "\u00A0" : ""}</span>
              ))}
              <span aria-hidden="true">”</span>
            </p>
            <p className="rcv-word mt-6 text-lg font-bold" style={{ color: "#E9C765", animationDelay: `${0.8 + Math.min(words.length, 60) * 0.11}s` }}>{msg.r}</p>

            <div className="rcv-word mt-9 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: `${1.2 + Math.min(words.length, 60) * 0.11}s` }}>
              <button onClick={alternarSom} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: "rgba(255,255,255,.12)", border: "1px solid #ffffff33" }}>
                {mudo ? <VolumeX size={14} /> : <Volume2 size={14} />} {mudo ? "Som desligado" : "Som ligado"}
              </button>
              <button onClick={ouvir} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: "rgba(255,255,255,.12)", border: "1px solid #ffffff33" }}>
                {lendo ? <Square size={13} /> : <Play size={13} />} {lendo ? "Parar leitura" : "Ouvir a mensagem"}
              </button>
            </div>
            <div className="rcv-word mt-6 flex flex-col sm:flex-row gap-2.5 w-full max-w-xs sm:max-w-none sm:justify-center" style={{ animationDelay: `${1.5 + Math.min(words.length, 60) * 0.11}s` }}>
              {msg.a && (
                <button onClick={() => { if (harpRef.current) harpRef.current.stop(); onOpenChapter(msg); }} className="rounded-full px-6 py-3 text-sm font-bold" style={{ background: "linear-gradient(135deg,#F3D77C,#CBA135)", color: "#2A1B00" }}>
                  Ler o capítulo completo
                </button>
              )}
              <button onClick={() => { if (harpRef.current) harpRef.current.stop(); onEnter(); }} className="rounded-full px-6 py-3 text-sm font-semibold" style={{ border: "1px solid #E9C76599", color: "#F3E6B8" }}>
                Conhecer a Bíblia Avivar
              </button>
            </div>
          </div>
        )}
        <p className="mt-10 text-[11px]" style={{ color: "#A99FBE" }}>Ministério Avivar do Espírito</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Abertura do app (tela de boas-vindas) — aparece uma vez por sessão */
/* ---------------------------------------------------------------- */
function HarpIcon({ size = 24, color = "#E9C765" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3c5 0 9 3 9 8 0 4-2 7-4 10H6V3z" />
      <path d="M6 3c0 6 2 12 5 18" />
      <path d="M9 5v13M12 7v11M14.5 9.5v8" />
      <path d="M4 21h9" />
    </svg>
  );
}

const INTRO_ITENS = [
  { icon: BookOpen, titulo: "Bíblia Sagrada completa", desc: "Os 66 livros, com leitura em voz alta e marca-texto." },
  { icon: GraduationCap, titulo: "Estudo de cada livro", desc: "História, contexto e ensinamentos Avivar." },
  { icon: "harpa", titulo: "Harpa Cristã", desc: "Conheça a história do hinário que o Brasil canta." },
  { icon: WifiOff, titulo: "Leia sem internet", desc: "Instale no celular e leve a Palavra para qualquer lugar." },
];

function InstalarLinkIntro() {
  const { instalado, instalarAgora } = useInstalar();
  if (instalado) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); instalarAgora(); }} className="intro-up mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2" style={{ border: "1px solid #CBA135", color: "#F3E6B8", background: "rgba(255,255,255,.06)", animationDelay: "1.3s" }}>
      <Smartphone size={16} /> Instalar no celular
    </button>
  );
}

function IntroBoasVindas({ onEnter }) {
  useEffect(() => {
    const t = setTimeout(onEnter, 9000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto" style={{ background: "radial-gradient(ellipse at 50% 0%, #2B1D4A 0%, #0B0B0C 62%)", color: "#FBF6ED" }} onClick={onEnter}>
      <style>{`
        @keyframes introUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes introGlow { 0%, 100% { box-shadow: 0 0 30px rgba(233,199,101,.25); } 50% { box-shadow: 0 0 60px rgba(233,199,101,.55); } }
        .intro-up { opacity: 0; animation: introUp .8s ease-out forwards; }
        .intro-glow { animation: introGlow 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .intro-up { animation-duration: .01s; animation-delay: 0s !important; } .intro-glow { animation: none; } }
      `}</style>
      <div className="min-h-full max-w-md mx-auto px-6 py-10 flex flex-col items-center text-center">
        <div className="intro-up" style={{ animationDelay: "0s" }}>
          <div className="intro-glow w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#0B0B0C", border: "1px solid #CBA13577" }}>
            <img src="/logo-icone.png" alt="Ministério Avivar do Espírito" className="h-14 w-auto" />
          </div>
        </div>
        <p className="intro-up mt-6 text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: "#CBA135", animationDelay: ".2s" }}>Ministério Avivar do Espírito</p>
        <h1 className="intro-up font-display text-4xl font-bold mt-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F3E6B8", animationDelay: ".3s" }}>Bíblia Avivar</h1>
        <p className="intro-up text-sm mt-2" style={{ color: "#C9C2D8", animationDelay: ".4s" }}>Leia. Entenda. Viva a Palavra.</p>
        <div className="intro-up w-12 h-0.5 my-6" style={{ background: "#CBA135", animationDelay: ".5s" }} />

        <div className="w-full space-y-3 text-left">
          {INTRO_ITENS.map((it, i) => (
            <div key={it.titulo} className="intro-up flex items-center gap-3.5 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,.06)", border: "1px solid #CBA13533", animationDelay: `${0.6 + i * 0.15}s` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#CBA13522" }}>
                {it.icon === "harpa" ? <HarpIcon size={22} /> : <it.icon size={20} color="#E9C765" />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#FBF6ED" }}>{it.titulo}</p>
                <p className="text-xs leading-snug" style={{ color: "#B9B0CC" }}>{it.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={(e) => { e.stopPropagation(); onEnter(); }} className="intro-up mt-8 rounded-full px-10 py-3.5 text-base font-bold focus:outline-none focus:ring-2" style={{ background: "linear-gradient(135deg,#F3D77C,#CBA135)", color: "#2A1B00", animationDelay: "1.3s" }}>
          Entrar
        </button>
        <InstalarLinkIntro />
        <p className="intro-up text-[11px] mt-3" style={{ color: "#8F86A6", animationDelay: "1.4s" }}>Toque em qualquer lugar para continuar</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Usar sem internet — baixa a Bíblia e os arquivos do app no aparelho */
/* ---------------------------------------------------------------- */
const OFFLINE_CACHE = "biblia-avivar-offline-v1";
const OFFLINE_FLAG = "biblia:offlinePronto";
function loadOfflineFlag() {
  try {
    return localStorage.getItem(OFFLINE_FLAG);
  } catch (e) {
    return null;
  }
}
async function prepararOffline() {
  if (!("caches" in window)) throw new Error("Este navegador não permite uso offline.");
  const cache = await caches.open(OFFLINE_CACHE);
  await loadStaticBible(); // baixa a Bíblia inteira (um único arquivo)
  const urls = new Set(["/", "/index.html", "/manifest.json", "/logo-icone.png", "/icon-192.png", "/icon-512.png", BIBLIA_HERO_IMG, "/og-biblia-avivar.jpg", STATIC_BIBLE_URL]);
  try {
    performance.getEntriesByType("resource").forEach((r) => {
      if (r.name.startsWith(window.location.origin) || r.name.includes("fonts.googleapis.com") || r.name.includes("fonts.gstatic.com")) urls.add(r.name);
    });
  } catch (e) {}
  let ok = 0;
  await Promise.all(
    [...urls].map(async (u) => {
      try {
        const res = await fetch(u, { mode: u.startsWith(window.location.origin) ? "same-origin" : "cors" });
        if (res.ok) {
          await cache.put(u, res);
          ok += 1;
        }
      } catch (e) {}
    })
  );
  if (!(await cache.match(STATIC_BIBLE_URL))) throw new Error("A Bíblia não foi guardada. Tente de novo com internet melhor.");
  try {
    localStorage.setItem(OFFLINE_FLAG, new Date().toISOString());
  } catch (e) {}
  return ok;
}

/* ---------- Instalar o app no celular (PWA) ---------- */
// O evento "beforeinstallprompt" é capturado já na abertura do site (e não só quando um card aparece),
// senão o navegador o dispara antes e o botão nunca aparece.
const instStore = { evt: null, instalado: false, modal: false, subs: new Set() };
const instAvisar = () => instStore.subs.forEach((f) => f());
function instEstaInstalado() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  } catch (e) {
    return false;
  }
}
if (typeof window !== "undefined") {
  instStore.instalado = instEstaInstalado();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    instStore.evt = e;
    instAvisar();
  });
  window.addEventListener("appinstalled", () => {
    instStore.instalado = true;
    instStore.evt = null;
    instStore.modal = false;
    instAvisar();
  });
}
function useInstalar() {
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((n) => n + 1);
    instStore.subs.add(f);
    return () => instStore.subs.delete(f);
  }, []);
  const instalarAgora = async () => {
    const e = instStore.evt;
    if (e) {
      instStore.evt = null; // o navegador só deixa usar o evento uma vez
      instAvisar();
      try {
        e.prompt();
        await e.userChoice;
      } catch (err) {
        instStore.modal = true;
        instAvisar();
      }
      return;
    }
    instStore.modal = true; // sem instalação direta (iPhone, WhatsApp/Instagram, etc.): mostra o passo a passo
    instAvisar();
  };
  const fecharModal = () => {
    instStore.modal = false;
    instAvisar();
  };
  return { instalado: instStore.instalado, nativo: !!instStore.evt, modal: instStore.modal, instalarAgora, fecharModal };
}
function instPlataforma() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const ios = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const dentroApp = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Telegram|Snapchat|Twitter|MicroMessenger|TikTok|; wv\)/i.test(ua);
  return { ios, android, dentroApp };
}

function InstalarModal() {
  const { modal, fecharModal } = useInstalar();
  const [copiado, setCopiado] = useState(false);
  if (!modal) return null;
  const { ios, android, dentroApp } = instPlataforma();
  const link = typeof window !== "undefined" ? window.location.origin + "/" : "https://biblia-avivar.vercel.app/";
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {
      window.prompt("Copie o link e abra no navegador:", link);
    }
  };
  let passos;
  if (ios) {
    passos = [
      dentroApp ? "Você abriu por dentro de outro app (WhatsApp, Instagram, Facebook…). Toque nos três pontinhos ou no ícone de compartilhar e escolha “Abrir no Safari”." : "Use o Safari (o navegador azul com bússola do iPhone).",
      "Toque no botão Compartilhar (o quadrado com uma seta para cima), na barra de baixo.",
      "Role a lista e toque em “Adicionar à Tela de Início”.",
      "Toque em “Adicionar”. O ícone da Bíblia Avivar aparece na tela do seu celular.",
    ];
  } else if (android) {
    passos = [
      dentroApp ? "Você abriu por dentro de outro app (WhatsApp, Instagram, Facebook…). Toque nos três pontinhos e escolha “Abrir no Chrome” (ou “Abrir no navegador”)." : "Abra este site no Chrome (ou no navegador do seu celular).",
      "Toque nos três pontinhos ⋮ no canto de cima.",
      "Toque em “Instalar app” (ou “Adicionar à tela inicial”).",
      "Confirme em “Instalar”. O ícone da Bíblia Avivar aparece na tela do seu celular.",
    ];
  } else {
    passos = [
      "No computador, use o Chrome ou o Edge.",
      "Clique no ícone de instalar (um monitor com uma seta) no lado direito da barra de endereço, ou no menu ⋮ → “Instalar Bíblia Avivar”.",
      "Confirme em “Instalar”.",
    ];
  }
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-4" style={{ background: "#000000AA" }} onClick={fecharModal}>
      <div className="w-full max-w-md rounded-2xl p-5 border max-h-[92vh] overflow-y-auto" style={{ background: C.black, borderColor: C.gold + "66", color: "#FBF6ED" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: C.goldBright }}>Instalar a Bíblia Avivar</h3>
            <p className="text-xs mt-1" style={{ color: "#C9C2D8" }}>Fica na tela do celular como um aplicativo, sem precisar de loja.</p>
          </div>
          <button onClick={fecharModal} aria-label="Fechar" className="p-1.5 rounded-full" style={{ color: C.gold }}><X size={20} /></button>
        </div>
        <ol className="mt-4 space-y-2.5">
          {passos.map((t, i) => (
            <li key={i} className="flex gap-3 items-start text-sm leading-snug">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: C.gold, color: C.black }}>{i + 1}</span>
              <span style={{ color: "#EDE7F7" }}>{t}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 mt-5">
          <Btn onClick={copiar}><Link2 size={14} /> {copiado ? "Link copiado!" : "Copiar link do app"}</Btn>
          <Btn variant="ghost" onClick={fecharModal}>Fechar</Btn>
        </div>
      </div>
    </div>
  );
}

function InstalarBanner() {
  const { instalado, instalarAgora } = useInstalar();
  if (instalado) return null;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
      <button onClick={instalarAgora} className="w-full text-left rounded-2xl p-4 sm:p-5 flex items-center gap-4 focus:outline-none focus:ring-2 transition hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg, #3A2A06 0%, #8B6F1F 100%)", border: `1px solid ${C.goldBright}88` }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#0B0B0C55", border: `1px solid ${C.goldBright}88` }}>
          <Smartphone size={26} color={C.goldBright} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-bold leading-tight" style={{ color: "#FFF4D0", fontFamily: "'Playfair Display', serif" }}>Instale o app no seu celular</p>
          <p className="text-xs leading-snug mt-0.5" style={{ color: "#F3E6B8" }}>Toque aqui e a Bíblia Avivar fica na sua tela inicial.</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold" style={{ background: C.goldBright, color: C.black }}><Download size={15} /> Instalar</span>
      </button>
    </div>
  );
}

function OfflineCard() {
  const [estado, setEstado] = useState(loadOfflineFlag() ? "pronto" : "ocioso");
  const [data, setData] = useState(loadOfflineFlag());
  const [erro, setErro] = useState("");
  const { instalado, instalarAgora: instalar } = useInstalar();
  const baixar = async () => {
    setEstado("baixando");
    setErro("");
    try {
      await prepararOffline();
      setData(loadOfflineFlag());
      setEstado("pronto");
    } catch (e) {
      setErro(e && e.message ? e.message : "Não foi possível baixar agora.");
      setEstado("erro");
    }
  };
  const dataTxt = data ? new Date(data).toLocaleDateString("pt-BR") : "";
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4 flex-wrap" style={{ background: C.cream, borderColor: C.gold + "55" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.gold + "22" }}>
        {estado === "pronto" ? <CheckCircle2 size={22} color="#2E7D4F" /> : <WifiOff size={21} color={C.goldDeep} />}
      </div>
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-sm" style={{ color: C.ink }}>{estado === "pronto" ? "Pronta para usar sem internet" : "Usar sem internet"}</p>
        <p className="text-xs leading-snug mt-0.5" style={{ color: C.stone }}>
          {estado === "pronto"
            ? `A Bíblia foi guardada neste aparelho${dataTxt ? ` em ${dataTxt}` : ""}. Instale o app (menu do navegador → Instalar / Adicionar à tela inicial) para abrir como aplicativo.`
            : "Baixe a Bíblia para este aparelho e leia em qualquer lugar. Para abrir como aplicativo, use o menu do navegador → Instalar app / Adicionar à tela inicial."}
        </p>
        {estado === "erro" && <p className="text-xs mt-1" style={{ color: "#B03428" }}>{erro}</p>}
      </div>
      {!instalado && (
        <Btn variant="ghost" onClick={instalar}><Smartphone size={14} /> Instalar app</Btn>
      )}
      <Btn onClick={baixar} disabled={estado === "baixando"} className="disabled:opacity-60">
        {estado === "baixando" ? <><Loader2 size={14} className="animate-spin" /> Baixando...</> : estado === "pronto" ? <><Download size={14} /> Atualizar</> : <><Download size={14} /> Baixar para usar sem internet</>}
      </Btn>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Harpa Cristã — história do hinário                                  */
/* ---------------------------------------------------------------- */
const HARPA_LINHA_TEMPO = [
  { ano: "1861", titulo: "Salmos e Hinos", texto: "Os evangélicos brasileiros cantavam com o hinário Salmos e Hinos, do casal de missionários Robert e Sarah Kalley (edição brasileira de 1861, com 50 títulos). A Assembleia de Deus ainda não tinha hinário próprio e usava esse livro." },
  { ano: "1911", titulo: "A Assembleia de Deus nasce em Belém", texto: "Os missionários suecos Gunnar Vingren e Daniel Berg fundaram em Belém do Pará a igreja que viria a ser a Assembleia de Deus no Brasil. Os hinos trazidos por eles vinham da tradição de cantos evangélicos da Suécia." },
  { ano: "1921", titulo: "Cantor Pentecostal", texto: "Em Belém, saiu o Cantor Pentecostal, com 44 hinos e 10 corinhos, impresso na tipografia Guajarina, com orientação editorial de Almeida Sobrinho. Foi o primeiro passo para um hinário próprio." },
  { ano: "1922", titulo: "Nasce a Harpa Cristã", texto: "Em Recife (PE) foi lançada a primeira edição da Harpa Cristã, sob a orientação editorial do pastor Adriano Nobre, com tiragem de mil exemplares distribuídos pelo missionário Samuel Nyström. Algumas fontes registram cerca de 100 hinos nessa primeira edição." },
  { ano: "1923", titulo: "Segunda edição: 300 hinos", texto: "Impressa no Rio de Janeiro, a segunda edição triplicou o número de hinos, chegando a 300." },
  { ano: "1932", titulo: "400 hinos", texto: "A Harpa chegou a 400 hinos. Nesse período, mesmo sem música impressa em todas as edições, o hinário já era o livro de canto das igrejas." },
  { ano: "1937", titulo: "Comissão para a edição com música", texto: "A Convenção Geral das Assembleias de Deus, reunida em São Paulo, nomeou uma comissão para publicar a Harpa Cristã com música. Participaram, entre outros, Emílio Conde, Samuel Nyström e Paulo Leivas Macalão." },
  { ano: "1941", titulo: "524 hinos", texto: "A Harpa chegou a 524 hinos, número que marcou o hinário por décadas." },
  { ano: "1979", titulo: "Revisão da CPAD", texto: "A Casa Publicadora das Assembleias de Deus (CPAD) formou uma comissão de revisão de letras e músicas, por proposta do pastor Adilson Soares da Fonseca." },
  { ano: "1992", titulo: "Harpa Cristã Atualizada", texto: "A CPAD lançou uma edição atualizada. Muitas igrejas, porém, preferiram continuar com a versão tradicional." },
  { ano: "Fim dos anos 1990", titulo: "Harpa Cristã Ampliada: 640 hinos", texto: "Os 524 hinos tradicionais, com a numeração antiga preservada, ganharam mais 116: são os 640 hinos de hoje. (As fontes variam entre 1996 e 1999 para essa edição.)" },
];

const HARPA_FONTES = [
  { nome: "Wikipédia — Harpa Cristã", url: "https://pt.wikipedia.org/wiki/Harpa_Crist%C3%A3" },
  { nome: "Billboard Brasil — Conheça a Harpa Cristã, considerada a “bíblia cantada”", url: "https://billboard.com.br/conheca-a-harpa-crista-considerada-a-biblia-cantada/" },
  { nome: "AD Tcdeipu — 100 anos da Harpa Cristã", url: "https://www.adtcdeipu.com.br/news-6-100-anos-da-harpa-crista-conheca-a-historia-do-hinario-oficial-das-assembleias-de-deus" },
  { nome: "IEAD JO — História da Harpa Cristã", url: "https://ieadjo.com/artigos/historia-da-harpa-crista" },
  { nome: "Revista Cristão Alerta — A Harpa Cristã e a sua história", url: "https://www.cristaoalerta.com.br/2020/05/harpa-crista-sua-historia.html" },
];

/* ---------------------------------------------------------------- */
/* Hinário — textos cadastrados pelo ministério (só o que há permissão */
/* de publicar). O admin cadastra um a um ou importa em lote.          */
/* ---------------------------------------------------------------- */
const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Importação em lote: aceita vários jeitos de o arquivo vir numerado.
//  "marcado"  → "### 12 - Título" ou "Hino 12 - Título"
//  "numerado" → "12. Título", "12 - Título" ou "12) Título" (a numeração precisa seguir a ordem)
//  "linha"    → o número sozinho numa linha e o título na linha seguinte
const FORMATOS_LOTE = [
  ["auto", "Detectar sozinho"],
  ["marcado", "### 12 - Título  (ou Hino 12 - Título)"],
  ["numerado", "12. Título  (ou 12 - Título, 12) Título)"],
  ["linha", "Número sozinho na linha, título na linha de baixo"],
];

function parseHinosLoteComo(txt, formato) {
  const linhas = String(txt || "").replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
  const out = [];
  let cur = null;
  let ultimo = 0;
  const abre = (numero, titulo) => {
    if (cur) out.push(cur);
    cur = { numero, titulo: titulo.trim(), letra: "" };
    ultimo = numero;
  };
  const sequencia = (n) => n > ultimo && n <= ultimo + 5; // evita confundir "2." de estrofe com um hino novo
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    let m;
    if (formato === "marcado" && (m = l.match(/^\s*(?:#{1,3}\s*|hino\s+)(\d{1,3})\s*[-–—.:)]?\s*(.*)$/i))) {
      abre(Number(m[1]), m[2] || "");
      continue;
    }
    if (formato === "numerado" && (m = l.match(/^\s*(\d{1,3})\s*[-–—.)]\s*(\S.{0,80})$/)) && (ultimo === 0 || sequencia(Number(m[1])))) {
      abre(Number(m[1]), m[2]);
      continue;
    }
    if (formato === "linha" && (m = l.match(/^\s*(\d{1,3})\s*$/)) && (ultimo === 0 || sequencia(Number(m[1])))) {
      let j = i + 1;
      while (j < linhas.length && !linhas[j].trim()) j++;
      if (j < linhas.length) {
        abre(Number(m[1]), linhas[j]);
        i = j;
        continue;
      }
    }
    if (cur) cur.letra += l + "\n";
  }
  if (cur) out.push(cur);
  return out
    .map((h) => ({ ...h, letra: h.letra.replace(/\n{3,}/g, "\n\n").trim() }))
    .filter((h) => h.numero && h.titulo && h.letra);
}

function parseHinosLote(txt, formato = "auto") {
  if (formato !== "auto") return parseHinosLoteComo(txt, formato);
  for (const f of ["marcado", "numerado", "linha"]) {
    const r = parseHinosLoteComo(txt, f);
    if (r.length) return r;
  }
  return [];
}

/* ---------- Harpa Cristã: importar direto do PDF (o arquivo é lido no próprio aparelho) ---------- */
const HARPA_PDFJS_FONTES = [
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/",
  "https://unpkg.com/pdfjs-dist@6.2.108/build/",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/",
];
let harpaPdfJsCache = null;
async function harpaCarregarPdfJs() {
  if (harpaPdfJsCache) return harpaPdfJsCache;
  let ultimoErro = null;
  for (const base of HARPA_PDFJS_FONTES) {
    try {
      const url = base + "pdf.min.mjs";
      const lib = await import(/* @vite-ignore */ url);
      lib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.mjs";
      harpaPdfJsCache = lib;
      return lib;
    } catch (e) { ultimoErro = e; }
  }
  throw new Error("Não consegui carregar o leitor de PDF. Confira a internet e tente de novo." + (ultimoErro ? "" : ""));
}
// Junta os pedaços de texto de uma página em linhas (pela altura) e devolve as linhas já limpas.
function harpaLinhasDaPagina(itens) {
  const ps = itens.filter((it) => it && typeof it.str === "string" && it.transform).map((it) => ({ x: it.transform[4], y: it.transform[5], w: it.width || 0, h: it.height || 8, s: it.str }));
  ps.sort((a, b) => b.y - a.y || a.x - b.x);
  const grupos = [];
  for (const p of ps) {
    const g = grupos[grupos.length - 1];
    if (g && Math.abs(g.y - p.y) <= Math.max(2.5, p.h * 0.4)) g.itens.push(p);
    else grupos.push({ y: p.y, itens: [p] });
  }
  return grupos.map((g) => {
    g.itens.sort((a, b) => a.x - b.x);
    let txt = ""; let prev = null;
    for (const it of g.itens) {
      if (prev && it.x - (prev.x + prev.w) > 1 && !txt.endsWith(" ") && !it.s.startsWith(" ")) txt += " ";
      txt += it.s; prev = it;
    }
    return txt.replace(/\s+$/g, "").replace(/^\s+/g, "");
  });
}
async function harpaLerPdf(arquivo, aoProgresso) {
  const pdfjs = await harpaCarregarPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const c = await pg.getTextContent();
    paginas.push(harpaLinhasDaPagina(c.items));
    if (aoProgresso) aoProgresso(i, doc.numPages);
  }
  return paginas;
}
const harpaMaiuscula = (s) => {
  const l = String(s).replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (l.length < 3) return false;
  let up = 0; for (const c of l) if (c === c.toUpperCase() && c !== c.toLowerCase()) up++;
  return up / l.length >= 0.7;
};
// Letras que o PDF leu errado em palavras todas maiúsculas (ex.: "CRElO", "MA!S", "OUEM").
const harpaCorrigirOcr = (s) => s.replace(/([A-ZÀ-Ú])[!l]([A-ZÀ-Ú])/g, "$1I$2").replace(/\bOU([EAI][A-ZÀ-Ú]*)\b/g, "QU$1");
const HARPA_MIUDAS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "as", "os", "em", "no", "na", "nos", "nas", "ao", "aos", "à", "com", "por", "para", "um", "uma", "que", "ou", "p'ra", "pra", "se"]);
function harpaTitulo(bruto) {
  const t = harpaCorrigirOcr(bruto.trim().replace(/\s+/g, " "));
  return t.toLowerCase().split(" ").map((p, i) => {
    if (i > 0 && HARPA_MIUDAS.has(p)) return p;
    return p.replace(/(^|[-'’(])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
  }).join(" ");
}
// Recebe as páginas (cada uma = lista de linhas) e devolve [{ numero, titulo, letra }].
function harpaParsePaginas(paginas) {
  const indice = []; paginas.forEach((p, i) => { if (p.filter((l) => /\.{5,}/.test(l)).length > 10) indice.push(i); });
  const ini = indice.length ? indice[indice.length - 1] + 1 : 0;
  const linhas = [];
  paginas.slice(ini).forEach((p) => p.forEach((l) => linhas.push(l.replace(/\s+$/g, "").replace(/^\s+/g, ""))));
  const pos = []; let esperado = 1;
  linhas.forEach((l, k) => {
    const m = l.match(/^(\d{1,3})\s*[.\-–]?\s+(\S.*)$/);
    if (m && Number(m[1]) === esperado && harpaMaiuscula(m[2])) { pos.push({ n: esperado, k, titulo: m[2] }); esperado++; }
  });
  if (pos.length < 3) return [];
  return pos.map((h, i) => {
    const fim = i + 1 < pos.length ? pos[i + 1].k : linhas.length;
    const corpo = [];
    for (let k = h.k + 1; k < fim; k++) {
      let l = linhas[k];
      if (harpaMaiuscula(l)) l = harpaCorrigirOcr(l);
      if (l === "" && (corpo.length === 0 || corpo[corpo.length - 1] === "")) continue;
      corpo.push(l);
    }
    while (corpo.length && corpo[corpo.length - 1] === "") corpo.pop();
    return { numero: h.n, titulo: harpaTitulo(h.titulo), letra: corpo.join("\n") };
  }).filter((h) => h.letra);
}

function HarpaHinos({ hinos, saveHinos, adminMode }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(null); // número do hino aberto
  const [edit, setEdit] = useState(null); // { numero, titulo, letra } em edição
  const [lote, setLote] = useState("");
  const [formato, setFormato] = useState("auto");
  const [aviso, setAviso] = useState("");
  const [fonte, setFonte] = useState(17);
  const [pdfHinos, setPdfHinos] = useState(null);
  const [pdfEstado, setPdfEstado] = useState("");

  const ordenados = useMemo(() => [...hinos].sort((a, b) => a.numero - b.numero), [hinos]);
  const q = semAcento(busca).trim();
  const lista = ordenados.filter((h) => !q || String(h.numero) === q || semAcento(h.titulo).includes(q) || String(h.numero).startsWith(q));
  const hino = aberto != null ? hinos.find((h) => h.numero === aberto) : null;

  const salvarUm = () => {
    const numero = Number(edit.numero);
    if (!numero || !edit.titulo.trim() || !edit.letra.trim()) {
      setAviso("Preencha número, título e texto.");
      return;
    }
    const novo = { numero, titulo: edit.titulo.trim(), letra: edit.letra.trim() };
    saveHinos([...hinos.filter((h) => h.numero !== numero), novo]);
    setEdit(null);
    setAviso(`Hino ${numero} salvo.`);
  };
  const importar = () => {
    const novos = pdfHinos || parseHinosLote(lote, formato);
    if (!novos.length) {
      setAviso("Não encontrei hinos nesse formato. Troque o formato acima ou confira se cada hino começa numerado.");
      return;
    }
    const nums = new Set(novos.map((h) => h.numero));
    saveHinos([...hinos.filter((h) => !nums.has(h.numero)), ...novos]);
    setLote("");
    setPdfHinos(null);
    setPdfEstado("");
    setAviso(`${novos.length} hino(s) importado(s).`);
  };
  const previaLote = useMemo(() => pdfHinos || (lote.trim() ? parseHinosLote(lote, formato) : []), [lote, formato, pdfHinos]);
  const lerPdf = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setPdfHinos(null); setLote("");
    try {
      setPdfEstado("Lendo o PDF…");
      const paginas = await harpaLerPdf(f, (i, n) => setPdfEstado(`Lendo página ${i} de ${n}…`));
      const lista = harpaParsePaginas(paginas);
      if (!lista.length) { setPdfEstado("Não reconheci hinos nesse PDF. Ele precisa ter cada hino numerado (1., 2., 3.…) com o título em letras maiúsculas."); return; }
      setPdfHinos(lista);
      setPdfEstado("");
    } catch (err) { setPdfEstado(String((err && err.message) || err)); }
  };
  const lerArquivo = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setPdfHinos(null); setLote(String(r.result || "")); };
    r.readAsText(f, "utf-8");
    e.target.value = "";
  };
  const excluir = (n) => {
    if (!window.confirm(`Excluir o hino ${n}?`)) return;
    saveHinos(hinos.filter((h) => h.numero !== n));
    setAberto(null);
  };
  const copiar = async (h) => {
    try {
      await navigator.clipboard.writeText(`${h.numero} - ${h.titulo}\n\n${h.letra}\n\nHarpa Cristã · Bíblia Avivar`);
      setAviso("Texto copiado.");
    } catch (e) {
      setAviso("Não foi possível copiar.");
    }
  };

  if (hino) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackButton onClick={() => setAberto(null)} label="Voltar aos hinos" />
        <p className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: C.gold }}>Harpa Cristã · Hino {hino.numero}</p>
        <h2 className="font-display text-3xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>{hino.titulo}</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setFonte((f) => Math.max(13, f - 2))}>A−</Btn>
          <Btn variant="ghost" onClick={() => setFonte((f) => Math.min(30, f + 2))}>A+</Btn>
          <Btn variant="ghost" onClick={() => copiar(hino)}><Link2 size={14} /> Copiar texto</Btn>
          {adminMode && <Btn variant="ghost" onClick={() => setEdit({ ...hino })}>Editar</Btn>}
          {adminMode && <Btn variant="ghost" color="#B03428" onClick={() => excluir(hino.numero)}><Trash2 size={14} /> Excluir</Btn>}
        </div>
        <div className="mt-6 whitespace-pre-line" style={{ fontFamily: "'Playfair Display', serif", fontSize: fonte, lineHeight: 1.8, color: "#241F30" }}>{hino.letra}</div>
        {aviso && <p className="text-xs mt-4" style={{ color: C.goldDeep }}>{aviso}</p>}
        {adminMode && edit && <HinoForm edit={edit} setEdit={setEdit} onSave={salvarUm} aviso={aviso} />}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2">
        <Search size={16} color={C.stone} />
        <input placeholder="Buscar por número ou título..." value={busca} onChange={(e) => setBusca(e.target.value)} className={`${inputCls} max-w-sm`} />
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-xl p-5 mt-6 text-sm leading-relaxed" style={{ background: C.gold + "18", border: `1px solid ${C.gold}55`, color: "#3A3447" }}>
          <b>Os hinos serão publicados aqui.</b> O ministério está cadastrando os textos que tem autorização para divulgar. Enquanto isso, leia a história da Harpa Cristã na aba “História”.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {lista.length === 0 && <p className="col-span-2 text-sm italic" style={{ color: C.stone }}>Nenhum hino encontrado.</p>}
          {lista.map((h) => (
            <button key={h.numero} onClick={() => { setAviso(""); setAberto(h.numero); window.scrollTo(0, 0); }} className="w-full min-w-0 text-left flex items-center gap-2 rounded-lg border px-2.5 sm:px-4 py-3 min-h-[56px] focus:outline-none focus:ring-2" style={{ borderColor: C.line, background: C.cream }}>
              <span className="font-mono text-xs sm:text-sm font-bold w-7 sm:w-10 shrink-0" style={{ color: C.goldDeep }}>{h.numero}</span>
              <span className="font-display font-semibold text-[13px] sm:text-[15px] leading-tight line-clamp-2 min-w-0" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>{h.titulo}</span>
            </button>
          ))}
        </div>
      )}

      {adminMode && (
        <div className="mt-8 rounded-xl border p-4" style={{ borderColor: C.gold + "66", background: C.cream }}>
          <p className="text-xs font-mono uppercase tracking-[0.15em] font-semibold" style={{ color: C.goldDeep }}>Administração do hinário</p>
          <p className="text-xs mt-1 leading-snug" style={{ color: C.stone }}>Cadastre apenas textos de domínio público ou que o ministério tenha autorização para publicar (por exemplo, da CPAD).</p>
          {edit ? (
            <HinoForm edit={edit} setEdit={setEdit} onSave={salvarUm} aviso={aviso} />
          ) : (
            <div className="mt-3">
              <Btn onClick={() => setEdit({ numero: "", titulo: "", letra: "" })}><Plus size={14} /> Cadastrar hino</Btn>
            </div>
          )}
          <p className="text-xs font-semibold mt-5 mb-1" style={{ color: C.ink }}>Importar a Harpa Cristã do PDF</p>
          <p className="text-[11px] mb-2 leading-snug" style={{ color: C.stone }}>Escolha o PDF da Harpa Cristã (com índice e hinos numerados). O arquivo é lido no seu aparelho; confira a contagem abaixo e toque em Importar. Precisa de internet só para abrir o leitor de PDF.</p>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <label className="inline-flex items-center gap-2 rounded-md text-sm font-semibold px-4 py-2 cursor-pointer" style={{ background: C.gold, color: C.ink }}>
              <FileText size={14} /> Escolher PDF da Harpa
              <input type="file" accept=".pdf,application/pdf" onChange={lerPdf} className="hidden" />
            </label>
            {pdfEstado && <span className="text-xs" style={{ color: C.goldDeep }}>{pdfEstado}</span>}
          </div>
          <p className="text-xs font-semibold mt-5 mb-1" style={{ color: C.ink }}>Importar vários de uma vez (texto)</p>
          <p className="text-[11px] mb-2 leading-snug" style={{ color: C.stone }}>Escolha um arquivo de texto (.txt) ou cole o conteúdo abaixo. Se estiver em Word ou PDF, copie o texto e cole aqui. Hinos com o mesmo número são substituídos.</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label className="inline-flex items-center gap-2 rounded-md text-sm font-semibold px-4 py-2 cursor-pointer" style={{ border: `1px solid ${C.gold}55`, color: C.gold }}>
              <Download size={14} /> Escolher arquivo .txt
              <input type="file" accept=".txt,.text,text/plain" onChange={lerArquivo} className="hidden" />
            </label>
            <select value={formato} onChange={(e) => setFormato(e.target.value)} className={`${inputCls} !w-auto max-w-full`}>
              {FORMATOS_LOTE.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <p className="text-[11px] mb-2 leading-snug" style={{ color: C.stone }}>Atenção: se as estrofes do seu texto também forem numeradas (1., 2., 3.), não use o formato “12. Título”, porque o app pode confundir estrofe com hino novo. Use “###” ou “Número sozinho na linha”. Confira sempre o resumo abaixo antes de importar.</p>
          <textarea rows={6} value={lote} onChange={(e) => { setPdfHinos(null); setLote(e.target.value); }} placeholder={"### 1 - Título do hino\nTexto do hino...\n\n### 2 - Outro título\nTexto..."} className={inputCls} />
          {(lote.trim() || pdfHinos) && (
            <p className="text-xs mt-2" style={{ color: previaLote.length ? "#2E7D4F" : "#B03428" }}>
              {previaLote.length
                ? `Encontrei ${previaLote.length} hino(s): do nº ${previaLote[0].numero} (${previaLote[0].titulo}) ao nº ${previaLote[previaLote.length - 1].numero} (${previaLote[previaLote.length - 1].titulo}).`
                : "Não encontrei hinos nesse formato. Troque o formato."}
            </p>
          )}
          <div className="mt-2"><Btn onClick={importar} disabled={!previaLote.length} className="disabled:opacity-50">Importar {previaLote.length ? `${previaLote.length} hinos` : "hinos"}</Btn></div>
          {aviso && <p className="text-xs mt-3" style={{ color: C.goldDeep }}>{aviso}</p>}
        </div>
      )}
    </div>
  );
}

function HinoForm({ edit, setEdit, onSave, aviso }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <input type="number" placeholder="Nº" value={edit.numero} onChange={(e) => setEdit({ ...edit, numero: e.target.value })} className={`${inputCls} !w-24`} />
        <input placeholder="Título do hino" value={edit.titulo} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} className={inputCls} />
      </div>
      <textarea rows={10} placeholder="Texto do hino (separe as estrofes com uma linha em branco)" value={edit.letra} onChange={(e) => setEdit({ ...edit, letra: e.target.value })} className={inputCls} />
      <div className="flex gap-2">
        <Btn onClick={onSave}>Salvar hino</Btn>
        <Btn variant="ghost" color={C.stone} onClick={() => setEdit(null)}>Cancelar</Btn>
      </div>
      {aviso && <p className="text-xs" style={{ color: "#B03428" }}>{aviso}</p>}
    </div>
  );
}

function HarpaCristaPage({ onBack, adminMode, hinos, saveHinos }) {
  const [aba, setAba] = useState("historia");
  return (
    <div>
      <div style={{ background: "linear-gradient(165deg, #0B0B0C 0%, #2B1D4A 70%, #0B0B0C 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 rounded-md px-1" style={{ color: C.goldBright }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#CBA13522", border: "1px solid #CBA13566" }}>
            <HarpIcon size={34} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] mt-5" style={{ color: C.gold }}>Hinário · História</p>
          <h1 className="font-display text-4xl font-bold mt-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F3E6B8" }}>Harpa Cristã</h1>
          <p className="font-display italic text-lg mt-1" style={{ fontFamily: "'Playfair Display', serif", color: "#E9DFC2" }}>a “Bíblia cantada” do povo evangélico brasileiro</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[["1922", "primeira edição"], ["Recife", "onde nasceu"], ["640", "hinos hoje"]].map(([n, l]) => (
              <div key={n} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,.07)", border: "1px solid #CBA13544" }}>
                <p className="font-display text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.goldBright }}>{n}</p>
                <p className="text-[11px]" style={{ color: "#B9B0CC" }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-7">
            {[["historia", "História"], ["hinos", `Hinos${hinos.length ? ` (${hinos.length})` : ""}`]].map(([k, label]) => (
              <button key={k} onClick={() => setAba(k)} className="px-5 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2" style={{ background: aba === k ? C.gold : "transparent", color: aba === k ? "#2A1B00" : "#F3E6B8", border: `1px solid ${C.gold}88` }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aba === "hinos" ? (
        <HarpaHinos hinos={hinos} saveHinos={saveHinos} adminMode={adminMode} />
      ) : (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Eyebrow>Como tudo começou</Eyebrow>
        <p className="text-[15px] leading-relaxed" style={{ color: "#241F30" }}>
          A Harpa Cristã é o hinário oficial das Assembleias de Deus no Brasil e é considerada o hinário evangélico mais usado do país. Seus hinos são cantados em cultos, em casa e nas ruas há mais de cem anos. Muitos cristãos a chamam de “Bíblia cantada”, porque ela leva a mensagem das Escrituras para a música.
        </p>
        <p className="text-[15px] leading-relaxed mt-3" style={{ color: "#241F30" }}>
          Quem ajudou a dar forma à Harpa foram, principalmente, o pastor <b>Adriano Nobre</b> (orientação editorial da primeira edição), o missionário <b>Samuel Nyström</b> (que traduziu hinos da tradição escandinava e distribuiu os primeiros exemplares) e <b>Paulo Leivas Macalão</b>, apontado como o principal tradutor e adaptador do hinário, que adequou letras e melodias ao português.
        </p>

        <h2 className="font-display text-2xl font-bold mt-10 mb-5" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>Linha do tempo</h2>
        <div className="relative pl-6" style={{ borderLeft: `2px solid ${C.gold}66` }}>
          {HARPA_LINHA_TEMPO.map((it) => (
            <div key={it.ano + it.titulo} className="relative mb-6">
              <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full" style={{ background: C.gold, boxShadow: `0 0 0 4px ${C.parchment}` }} />
              <p className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: C.goldDeep }}>{it.ano}</p>
              <p className="font-display font-bold text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>{it.titulo}</p>
              <p className="text-sm leading-relaxed mt-1" style={{ color: "#3A3447" }}>{it.texto}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold mt-8 mb-4" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>Por que ela marcou o Brasil</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#3A3447" }}>
          A Harpa ajudou a uniformizar o jeito de cantar nas igrejas de regiões muito diferentes do país e criou uma identidade comum entre os irmãos. Muitos cantores evangélicos brasileiros cresceram cantando seus hinos, e vários artistas regravam essas canções até hoje.
        </p>

        <div className="rounded-xl p-4 mt-8 text-sm leading-relaxed" style={{ background: C.gold + "18", border: `1px solid ${C.gold}55`, color: "#3A3447" }}>
          <b>Aviso:</b> por respeito aos direitos autorais do hinário, a Bíblia Avivar traz aqui a <b>história</b> da Harpa Cristã, sem reproduzir as letras dos hinos por conta própria. Os textos ficam na aba “Hinos” e só são publicados os que o ministério tem autorização para divulgar. Para cantar, use a Harpa da sua igreja ou adquira a edição oficial da CPAD. Os relatos variam um pouco entre as fontes (como o número de hinos da primeira edição e o ano da edição ampliada), e isso está indicado acima.
        </div>

        <h3 className="text-xs font-mono uppercase tracking-[0.15em] font-semibold mt-8 mb-2" style={{ color: C.ink }}>Fontes</h3>
        <ul className="space-y-1.5">
          {HARPA_FONTES.map((f) => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs underline break-words" style={{ color: C.goldDeep }}>{f.nome}</a>
            </li>
          ))}
        </ul>
      </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Fontes do texto bíblico                                            */
/* ---------------------------------------------------------------- */
async function fetchChapterFromApi(bookAbbr, chapter) {
  const res = await fetch(`${BIBLE_API_BASE}/verses/${BIBLE_VERSION}/${bookAbbr}/${chapter}`, {
    headers: BIBLE_API_TOKEN ? { Authorization: `Bearer ${BIBLE_API_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error("Falha ao buscar capítulo (API com token)");
  return res.json();
}

const STATIC_BIBLE_URL = "https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/nvi.json";
let staticBiblePromise = null;

function loadStaticBible() {
  if (!staticBiblePromise) {
    staticBiblePromise = fetch(STATIC_BIBLE_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao baixar o arquivo da Bíblia");
        return r.json();
      })
      .catch((e) => {
        staticBiblePromise = null;
        throw e;
      });
  }
  return staticBiblePromise;
}

async function fetchChapterFromStatic(bookAbbr, chapter) {
  const data = await loadStaticBible();
  const book = data.find((b) => b.abbrev === bookAbbr);
  if (!book) throw new Error(`Livro "${bookAbbr}" não encontrado no arquivo estático`);
  const versesArr = book.chapters[chapter - 1];
  if (!versesArr) throw new Error("Capítulo não encontrado no arquivo estático");
  return { verses: versesArr.map((text, idx) => ({ number: idx + 1, text })) };
}

async function fetchChapter(bookAbbr, chapter) {
  try {
    return await fetchChapterFromStatic(bookAbbr, chapter);
  } catch (e1) {
    try {
      return await fetchChapterFromApi(bookAbbr, chapter);
    } catch (e2) {
      throw e2;
    }
  }
}

/* ---------------------------------------------------------------- */
/* "Palavra do dia" (Home) — sorteia uma referência conhecida por dia do   */
/* ano e busca o texto de verdade pela mesma fetchChapter usada na leitura */
/* (arquivo estático da Bíblia, com fallback pra API) — nunca texto digitado */
/* à mão, sempre o versículo real. */
/* ---------------------------------------------------------------- */
const PALAVRA_DO_DIA_REFS = [
  { abbr: "sl", chapter: 23, verse: 1, label: "Salmos 23:1" },
  { abbr: "jo", chapter: 3, verse: 16, label: "João 3:16" },
  { abbr: "fp", chapter: 4, verse: 13, label: "Filipenses 4:13" },
  { abbr: "js", chapter: 1, verse: 9, label: "Josué 1:9" },
  { abbr: "is", chapter: 41, verse: 10, label: "Isaías 41:10" },
  { abbr: "mt", chapter: 11, verse: 28, label: "Mateus 11:28" },
  { abbr: "pv", chapter: 3, verse: 5, label: "Provérbios 3:5" },
  { abbr: "rm", chapter: 8, verse: 28, label: "Romanos 8:28" },
  { abbr: "sl", chapter: 46, verse: 1, label: "Salmos 46:1" },
  { abbr: "hb", chapter: 4, verse: 12, label: "Hebreus 4:12" },
];
function refPalavraDoDia() {
  const dia = Math.floor(Date.now() / 86400000); // dias desde 1970 — muda uma vez por dia
  return PALAVRA_DO_DIA_REFS[dia % PALAVRA_DO_DIA_REFS.length];
}
async function fetchPalavraDoDia() {
  const ref = refPalavraDoDia();
  const data = await fetchChapter(ref.abbr, ref.chapter);
  const v = (data.verses || []).find((x) => x.number === ref.verse);
  return { texto: v ? v.text : "", label: ref.label, abbr: ref.abbr, chapter: ref.chapter };
}

/* ---------------------------------------------------------------- */
/* UI básica                                                          */
/* ---------------------------------------------------------------- */
function Btn({ children, onClick, variant = "primary", color = C.gold, className = "", ...rest }) {
  const style =
    variant === "primary" ? { background: color, color: "#fff" } : { background: "transparent", color, border: `1px solid ${color}55` };
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-md text-sm font-semibold transition px-4 py-2 hover:opacity-90 focus:outline-none focus:ring-2 ${className}`} style={style} {...rest}>
      {children}
    </button>
  );
}

function Eyebrow({ children, color = C.gold }) {
  return <div className="uppercase text-xs tracking-[0.2em] font-mono font-semibold mb-2" style={{ color }}>{children}</div>;
}

function BackButton({ onClick, label = "Voltar" }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 focus:outline-none focus:ring-2 rounded-md px-1" style={{ color: C.goldDeep }}>
      <ArrowLeft size={16} /> {label}
    </button>
  );
}

/* ---------------------------------------------------------------- */
/* Player de música de fundo — opcional, fixo, disponível em todo app */
/* ---------------------------------------------------------------- */
function MusicPlayer({ config }) {
  const [pref, setPref] = useState(loadMusicPrefLocal);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const audioRef = useRef(null);
  const tracks = config?.tracks || [];
  const currentTrack = tracks.find((t) => t.url === pref.track);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = pref.volume;
  }, [pref.volume]);

  useEffect(() => {
    saveMusicPrefLocal(pref);
  }, [pref]);

  useEffect(() => {
    setPlaying(false);
  }, [pref.track]);

  const toggle = () => {
    if (!currentTrack) {
      setOpen(true);
      return;
    }
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  };

  if (tracks.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {currentTrack && <audio ref={audioRef} src={currentTrack.url} loop />}
      {open && (
        <div className="absolute bottom-14 right-0 w-60 rounded-lg shadow-xl border p-3 space-y-2" style={{ background: C.black, borderColor: C.gold + "33" }}>
          <p className="text-xs font-mono mb-1" style={{ color: C.stone }}>Música de fundo (opcional)</p>
          <button
            onClick={() => {
              setPref((p) => ({ ...p, track: "" }));
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1.5 rounded text-xs"
            style={{ background: !pref.track ? C.gold + "33" : "transparent", color: C.gold }}
          >
            Sem música
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setPref((p) => ({ ...p, track: t.url }));
                setOpen(false);
                setTimeout(() => {
                  audioRef.current?.play().catch(() => {});
                  setPlaying(true);
                }, 100);
              }}
              className="w-full text-left px-2 py-1.5 rounded text-xs"
              style={{ background: pref.track === t.url ? C.gold + "33" : "transparent", color: C.gold }}
            >
              {t.nome}
            </button>
          ))}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={pref.volume}
            onChange={(e) => setPref((p) => ({ ...p, volume: parseFloat(e.target.value) }))}
            className="w-full"
          />
        </div>
      )}
      <div className="flex items-center gap-1">
        <button onClick={toggle} className="p-3 rounded-full shadow-lg focus:outline-none focus:ring-2" style={{ background: C.gold, color: "#fff" }} title="Música de fundo">
          {playing ? <Pause size={18} /> : <Music size={18} />}
        </button>
        <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-full shadow-lg text-xs" style={{ background: C.black, color: C.gold, border: `1px solid ${C.gold}55` }}>
          ⋯
        </button>
      </div>
    </div>
  );
}

function NavBar({ onHome, onAnotacoes, adminMode, onAdminClick }) {
  const { instalado, instalarAgora } = useInstalar();
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: C.black, borderColor: C.gold + "55" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={onHome} className="flex items-center gap-3 focus:outline-none focus:ring-2 rounded-md p-1">
          <img src="/logo-icone.png" alt="Bíblia Avivar" className="h-10 w-auto" />
          <span className="font-display font-semibold text-lg" style={{ color: C.goldBright, fontFamily: "'Playfair Display', serif" }}>Bíblia Avivar</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {!instalado && (
            <button onClick={instalarAgora} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2" style={{ background: C.goldBright, color: C.black }} title="Instalar o app no celular">
              <Download size={14} /> Instalar
            </button>
          )}
          <button onClick={onAnotacoes} className="p-2 rounded-full focus:outline-none focus:ring-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.gold }} title="Minhas anotações">
            <StickyNote size={18} /> <span className="hidden sm:inline">Anotações</span>
          </button>
          <span className="w-px h-5" style={{ background: C.gold + "33" }} />
          <button onClick={onAdminClick} className="p-2 rounded-full focus:outline-none focus:ring-2" title={adminMode ? "Sair do modo admin" : "Entrar como admin"} style={{ background: adminMode ? C.gold : "transparent", color: adminMode ? C.black : C.gold }}>
            {adminMode ? <ShieldCheck size={18} /> : <Lock size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminGateModal({ onClose, onSuccess }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [enviando, setEnviando] = useState(false);
  const entrar = async () => {
    if (enviando || !pw) return;
    setEnviando(true); setErr("");
    const r = await privateLogin(pw);
    setEnviando(false);
    if (r.ok) onSuccess();
    else setErr(r.motivo === "muitas_tentativas" ? "Muitas tentativas. Aguarde alguns minutos." : r.motivo === "sem_conexao" ? "Sem conexão com o servidor. Tente de novo." : "Senha incorreta.");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000088" }}>
      <div className="w-full max-w-sm rounded-xl p-6 border" style={{ background: C.black, borderColor: C.gold + "44" }}>
        <div className="flex items-center gap-2 mb-3" style={{ color: C.gold }}>
          <ShieldCheck size={20} />
          <h3 className="font-semibold text-lg text-white">Acesso administrativo</h3>
        </div>
        <input type="password" autoFocus placeholder="Senha master" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className={inputCls} />
        {err && <p className="text-xs mt-2" style={{ color: "#F2A6A6" }}>{err}</p>}
        <div className="flex gap-2 mt-4">
          <Btn onClick={entrar}>{enviando ? "Verificando…" : "Entrar"}</Btn>
          <Btn variant="ghost" color={C.stone} onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Home — dashboard de entrada (hero, continuar leitura, palavra do   */
/* dia, acessos rápidos, livros em destaque) + lista completa de      */
/* livros logo abaixo (busca + Antigo/Novo Testamento, como antes).   */
/* ---------------------------------------------------------------- */
const QUICK_ACCESS_PILLS = OLD_TESTAMENT.slice(0, 8); // Gênesis...Rute

function ContinueLeituraCard({ ultimaLeitura, onOpenBook }) {
  if (!ultimaLeitura) {
    return (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onOpenBook(findBook("gn"), 1, "ler"); }}
        className="rounded-2xl border p-6 sm:p-7 flex flex-col justify-between focus:outline-none focus:ring-2 hover:brightness-[1.02] transition"
        style={{ background: C.cream, borderColor: C.line, flex: "0 0 63%" }}
      >
        <div>
          <Eyebrow color={C.goldDeep}>Comece por aqui</Eyebrow>
          <h3 className="font-display font-semibold text-xl" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>Gênesis 1</h3>
          <p className="text-sm mt-1.5" style={{ color: C.stone }}>Você ainda não começou a ler neste aparelho — que tal começar pelo princípio?</p>
        </div>
        <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold rounded-full px-4 py-2 self-start" style={{ background: C.gold, color: "#fff" }}>
          Começar a ler <ChevronRight size={15} />
        </span>
      </a>
    );
  }
  const progresso = Math.round((ultimaLeitura.capitulo / ultimaLeitura.totalCapitulos) * 100);
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onOpenBook(findBook(ultimaLeitura.abbr), ultimaLeitura.capitulo, "ler"); }}
      className="rounded-2xl border p-6 sm:p-7 flex flex-col justify-between focus:outline-none focus:ring-2 hover:brightness-[1.02] transition"
      style={{ background: C.cream, borderColor: C.line, flex: "0 0 63%" }}
    >
      <div>
        <Eyebrow color={C.goldDeep}>Continue sua leitura</Eyebrow>
        <h3 className="font-display font-semibold text-xl" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{ultimaLeitura.nome} {ultimaLeitura.capitulo}</h3>
        {ultimaLeitura.primeiraLinha && (
          <p className="text-sm mt-1.5 line-clamp-2" style={{ color: C.stone }}>"{ultimaLeitura.primeiraLinha}"</p>
        )}
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: C.stone }}>{ultimaLeitura.totalVersiculos ? `${ultimaLeitura.totalVersiculos} versículos` : `Capítulo ${ultimaLeitura.capitulo} de ${ultimaLeitura.totalCapitulos}`}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2" style={{ background: C.gold, color: "#fff" }}>
            Continuar <ChevronRight size={15} />
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
          <div className="h-full rounded-full" style={{ width: `${progresso}%`, background: C.gold }} />
        </div>
      </div>
    </a>
  );
}

function PalavraDoDiaCard({ onOpenBook }) {
  const [pdd, setPdd] = useState(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let cancelled = false;
    fetchPalavraDoDia()
      .then((r) => { if (!cancelled) { setPdd(r); setState(r.texto ? "ok" : "error"); } })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="rounded-2xl border p-6 sm:p-7 flex flex-col justify-between" style={{ flex: 1, background: "linear-gradient(160deg,#FBF1DC 0%,#F6E7C8 100%)", borderColor: C.gold + "48" }}>
      <div>
        <Eyebrow color={C.goldDeep}>Palavra do dia</Eyebrow>
        {state === "loading" && <p className="text-sm italic mt-2" style={{ color: C.stone }}>Carregando...</p>}
        {state === "error" && <p className="text-sm italic mt-2" style={{ color: C.stone }}>Não foi possível carregar agora.</p>}
        {state === "ok" && (
          <>
            <p className="font-display text-lg italic mt-2 leading-snug" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>"{pdd.texto}"</p>
            <p className="text-xs mt-2 font-semibold" style={{ color: C.stone }}>{pdd.label}</p>
          </>
        )}
      </div>
      {state === "ok" && (
        <button onClick={() => onOpenBook(findBook(pdd.abbr), pdd.chapter, "ler")} className="text-sm font-bold mt-4 self-start" style={{ color: C.goldDeep }}>
          Ler agora →
        </button>
      )}
    </div>
  );
}

function AcessoRapidoCard({ icon: Icon, tone, titulo, desc, onClick, disabled, external }) {
  const iconBg = tone === "violet" ? "#7B5CB214" : C.gold + "22";
  const iconColor = tone === "violet" ? "#4B3B77" : C.goldDeep;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="text-left rounded-xl border p-4 flex flex-col gap-2.5 focus:outline-none focus:ring-2 transition hover:-translate-y-0.5"
      style={{ background: C.cream, borderColor: C.line, opacity: disabled ? 0.55 : 1, cursor: disabled ? "default" : "pointer" }}
    >
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: iconBg }}>
        <Icon size={17} color={iconColor} />
      </div>
      <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: C.ink }}>
        {titulo}
        {external && <ExternalLink size={11} color={C.stone} />}
        {disabled && <span className="text-[9px] font-mono uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: C.line, color: C.stone }}>em breve</span>}
      </p>
      <p className="text-xs leading-snug" style={{ color: C.stone }}>{desc}</p>
    </button>
  );
}

function Home({ onOpenBook, onAnotacoes, onHarpa }) {
  const [testament, setTestament] = useState("at");
  const [query, setQuery] = useState("");
  const [ultimaLeitura] = useState(loadUltimaLeituraLocal);
  const list = (testament === "at" ? OLD_TESTAMENT : NEW_TESTAMENT).filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );
  const irParaLivros = () => {
    const el = document.getElementById("livros");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* HERO */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-lg" style={{ minHeight: 280 }}>
          <div className="sm:w-[44%] p-7 sm:p-9 flex flex-col justify-center gap-3" style={{ background: `linear-gradient(165deg, ${C.black} 0%, #241A38 65%, ${C.black} 100%)` }}>
            <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: C.gold }}>Olá!</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight" style={{ color: C.parchment, fontFamily: "'Playfair Display', serif" }}>Bem-vindo à<br />Bíblia Avivar</h1>
            <div className="w-12 h-0.5" style={{ background: C.gold }} />
            <p className="text-sm" style={{ color: "#C9C2D8" }}>Leia. Entenda. Viva a Palavra.</p>
          </div>
          <div className="sm:w-[56%] min-h-[200px] relative">
            <img src={BIBLIA_HERO_IMG} alt="Bíblia aberta sobre as montanhas ao amanhecer" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <InstalarBanner />

      {/* HARPA CRISTÃ — destaque */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
        <button onClick={onHarpa} className="w-full text-left rounded-2xl p-4 sm:p-5 flex items-center gap-4 focus:outline-none focus:ring-2 transition hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg, #1A1030 0%, #3A2563 100%)", border: `1px solid ${C.gold}66` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#CBA13525", border: "1px solid #CBA13566" }}>
            <HarpIcon size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: C.goldBright }}>Novo · Hinário</p>
            <p className="font-display text-lg font-bold leading-tight" style={{ color: "#F3E6B8", fontFamily: "'Playfair Display', serif" }}>Harpa Cristã</p>
            <p className="text-xs leading-snug" style={{ color: "#C9C2D8" }}>Conheça a história do hinário: como surgiu, quando, quem e onde.</p>
          </div>
          <ChevronRight size={20} color={C.goldBright} />
        </button>
      </div>

      {/* LOUVOR AVIVAR DO ESPÍRITO — app irmão */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-3">
        <button onClick={() => window.open("https://avivardoespirito.com.br/?app=music", "_blank", "noopener,noreferrer")} className="w-full text-left rounded-2xl p-4 sm:p-5 flex items-center gap-4 focus:outline-none focus:ring-2 transition hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg, #2A0F42 0%, #351052 100%)", border: `1px solid ${C.gold}66` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#CBA13525", border: "1px solid #CBA13566" }}>
            <Music size={26} color={C.goldBright} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: C.goldBright }}>App do Ministério</p>
            <p className="font-display text-lg font-bold leading-tight" style={{ color: "#F3E6B8", fontFamily: "'Playfair Display', serif" }}>Louvor Avivar do Espírito</p>
            <p className="text-xs leading-snug" style={{ color: "#C9C2D8" }}>Louvores, cifras, vídeos e aulas. Abre o app do louvor.</p>
          </div>
          <ChevronRight size={20} color={C.goldBright} />
        </button>
      </div>

      {/* CONTINUE / PALAVRA DO DIA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4 flex flex-col sm:flex-row gap-4">
        <ContinueLeituraCard ultimaLeitura={ultimaLeitura} onOpenBook={onOpenBook} />
        <PalavraDoDiaCard onOpenBook={onOpenBook} />
      </div>

      {/* ACESSOS RÁPIDOS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AcessoRapidoCard icon={BookOpen} titulo="Explore a Bíblia" desc="Todos os livros, capítulos e versículos." onClick={irParaLivros} />
        <AcessoRapidoCard icon={GraduationCap} tone="violet" titulo="Estudos Avivar" desc="Contexto, ensinamentos e aplicações." onClick={irParaLivros} />
        <AcessoRapidoCard icon={CalendarDays} titulo="Planos de Leitura" desc="Leia a Bíblia em diferentes planos." disabled />
        <AcessoRapidoCard icon={HandHeart} tone="violet" titulo="Oração" desc="Peça oração no site do Ministério." external onClick={() => window.open("https://avivardoespirito.com.br", "_blank", "noopener,noreferrer")} />
        <AcessoRapidoCard icon={StickyNote} titulo="Minha Bíblia" desc="Versículos, anotações e favoritos." onClick={onAnotacoes} />
        <AcessoRapidoCard icon={HarpIcon} tone="violet" titulo="Harpa Cristã" desc="A história do hinário." onClick={onHarpa} />
      </div>

      {/* USAR SEM INTERNET */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
        <OfflineCard />
      </div>

      {/* LIVROS EM DESTAQUE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-7">
        <h4 className="text-xs font-mono uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: C.ink }}>Livros da Bíblia</h4>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACCESS_PILLS.map((b) => (
            <button key={b.abbr} onClick={() => onOpenBook(b)} className="px-4 py-2 rounded-full border text-sm font-medium focus:outline-none focus:ring-2" style={{ borderColor: C.line, background: C.cream, color: C.ink }}>
              {b.name}
            </button>
          ))}
          <button onClick={irParaLivros} className="px-4 py-2 rounded-full border text-sm font-bold focus:outline-none focus:ring-2" style={{ borderColor: C.gold, background: C.cream, color: C.goldDeep }}>
            Ver todos →
          </button>
        </div>
      </div>

      {/* LISTA COMPLETA — busca + Antigo/Novo Testamento (como sempre foi) */}
      <div id="livros" className="max-w-5xl mx-auto px-4 sm:px-6 py-10 mt-4 scroll-mt-20">
        <Eyebrow>Ministério Avivar do Espírito</Eyebrow>
        <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>Bíblia Sagrada e Estudos</h2>
        <p className="text-sm mt-2" style={{ color: C.stone }}>Leia a Palavra, explore o histórico e o estudo de cada livro, capítulo por capítulo.</p>

        <div className="flex items-center gap-2 mt-6">
          <Search size={16} color={C.stone} />
          <input placeholder="Buscar livro..." value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputCls} max-w-xs`} />
        </div>

        <div className="flex gap-2 mt-4">
          {[
            ["at", "Antigo Testamento"],
            ["nt", "Novo Testamento"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTestament(k)} className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: testament === k ? C.gold : "transparent", color: testament === k ? "#fff" : C.ink, border: `1px solid ${C.gold}55` }}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
          {list.map((b) => (
            <button key={b.abbr} onClick={() => onOpenBook(b)} className="text-left p-4 rounded-lg border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2" style={{ borderColor: C.line, background: C.cream }}>
              <p className="font-display font-semibold text-sm" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{b.name}</p>
              <p className="text-xs mt-1 font-mono" style={{ color: C.stone }}>{b.chapters} capítulos</p>
            </button>
          ))}
        </div>
      </div>

      {/* RODAPÉ DEVOCIONAL */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <span className="w-8 h-px" style={{ background: C.gold + "80" }} />
          <span className="w-1.5 h-1.5 rotate-45" style={{ background: C.gold }} />
          <span className="w-8 h-px" style={{ background: C.gold + "80" }} />
        </div>
        <p className="font-display text-base italic" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>"A Palavra de Deus é viva e eficaz."</p>
        <p className="text-xs mt-1 tracking-wide" style={{ color: C.stone }}>HEBREUS 4:12</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Anotações pessoais — página própria                                */
/* ---------------------------------------------------------------- */
function AnotacoesPage({ onBack }) {
  const [notes, setNotes] = useState(loadNotesLocal);
  const [texto, setTexto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [cor, setCor] = useState("");

  const add = () => {
    if (!texto.trim()) return;
    const next = [{ id: uid(), texto: texto.trim(), referencia: referencia.trim(), cor: cor || null, data: new Date().toISOString() }, ...notes];
    setNotes(next);
    saveNotesLocal(next);
    setTexto("");
    setReferencia("");
    setCor("");
  };
  const del = (id) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotesLocal(next);
  };
  const exportPDF = () => {
    const rows = notes
      .map(
        (n) =>
          `<div class="nota" style="border-left:4px solid ${n.cor || "#CBA135"};padding-left:10px;"><span class="ref">${n.referencia || "Anotação geral"}</span> — ${new Date(n.data).toLocaleDateString("pt-BR")}${n.trecho ? `<p style="font-style:italic;">"${n.trecho}"</p>` : ""}<p>${n.texto}</p></div>`
      )
      .join("");
    printPage("Minhas Anotações — Bíblia Avivar", rows || "<p>Nenhuma anotação ainda.</p>");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onClick={onBack} label="Voltar" />
      <Eyebrow><StickyNote size={12} className="inline mr-1" />Espaço pessoal</Eyebrow>
      <h1 className="font-display text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>Minhas Anotações</h1>
      <p className="text-sm mt-2" style={{ color: C.stone }}>Suas anotações ficam salvas só neste aparelho.</p>

      <div className="mt-6 p-4 rounded-lg border space-y-2" style={{ borderColor: C.line, background: "#00000006" }}>
        <input placeholder="Referência (opcional — ex: João 3:16)" value={referencia} onChange={(e) => setReferencia(e.target.value)} className={inputCls} />
        <textarea rows={4} placeholder="Escreva sua anotação..." value={texto} onChange={(e) => setTexto(e.target.value)} className={inputCls} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: C.stone }}>Cor (opcional):</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button key={c.key} onClick={() => setCor(cor === c.color ? "" : c.color)} className="w-5 h-5 rounded-full border-2" style={{ background: c.color, borderColor: cor === c.color ? C.ink : "transparent" }} />
          ))}
        </div>
        <Btn onClick={add}><Plus size={14} /> Salvar anotação</Btn>
      </div>

      {notes.length > 0 && (
        <Btn variant="ghost" className="mt-4" onClick={exportPDF}><Download size={14} /> Baixar PDF das anotações</Btn>
      )}

      <div className="mt-6 space-y-3">
        {notes.length === 0 && <p className="text-sm italic text-center py-8" style={{ color: C.stone }}>Nenhuma anotação ainda.</p>}
        {notes.map((n) => (
          <div key={n.id} className="p-4 rounded-lg border" style={{ borderColor: C.line, borderLeft: `4px solid ${n.cor || C.line}`, background: n.cor ? n.cor + "14" : "#fff" }}>
            <div className="flex justify-between items-start">
              <div>
                {n.referencia && <p className="text-xs font-mono font-semibold" style={{ color: C.goldDeep }}>{n.referencia}</p>}
                <p className="text-xs" style={{ color: C.stone }}>{new Date(n.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => del(n.id)}><Trash2 size={14} color={C.stone} /></button>
            </div>
            {n.trecho && <p className="text-sm italic mt-2" style={{ color: C.ink }}>"{n.trecho}"</p>}
            <p className="text-sm mt-2 whitespace-pre-line">{n.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Livro — capítulos, leitura, estudo e histórico                     */
/* ---------------------------------------------------------------- */
const STUDY_FIELDS = [
  { key: "titulo", label: "Título do estudo" },
  { key: "imageUrl", label: "URL de imagem (opcional)", type: "url" },
  { key: "texto", label: "Texto do estudo", type: "textarea" },
];

const HIGHLIGHT_COLORS = [
  { key: "amarelo", color: "#F5E050" },
  { key: "verde", color: "#8FD19E" },
  { key: "azul", color: "#8FC6F0" },
  { key: "rosa", color: "#F5A6C8" },
];

/* Desenha o texto de um versículo com os trechos selecionados destacados —
   fundo colorido + contorno, tipo marca-texto físico. Cada marca guarda o
   início/fim do trecho dentro do texto do versículo. Clicar num trecho já
   marcado remove a marcação. */
function VerseText({ text, verseMarks, onRemoveMark }) {
  if (!verseMarks || verseMarks.length === 0) return <>{text}</>;
  const sorted = [...verseMarks].sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;
  sorted.forEach((m, i) => {
    if (m.start > cursor) parts.push(<React.Fragment key={`p${i}`}>{text.slice(cursor, m.start)}</React.Fragment>);
    parts.push(
      <mark
        key={m.id}
        onClick={(e) => {
          e.stopPropagation();
          onRemoveMark(m.id);
        }}
        title="Toque pra remover a marcação"
        style={{ background: m.color + "77", border: `1.5px solid ${m.color}`, borderRadius: 4, padding: "0 2px", cursor: "pointer" }}
      >
        {text.slice(m.start, m.end)}
      </mark>
    );
    cursor = Math.max(cursor, m.end);
  });
  if (cursor < text.length) parts.push(<React.Fragment key="pend">{text.slice(cursor)}</React.Fragment>);
  return <>{parts}</>;
}

function DynamicForm({ fields, onSubmit, submitLabel = "Salvar", initial = {} }) {
  const empty = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, initial[f.key] || ""])), [fields]);
  const [vals, setVals] = useState(empty);
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  return (
    <div className="grid gap-3 p-4 rounded-lg border" style={{ borderColor: C.line, background: "#00000006" }}>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-semibold mb-1 font-mono" style={{ color: C.stone }}>{f.label}</label>
          {f.type === "textarea" ? (
            <textarea rows={6} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
          ) : (
            <input type={f.type || "text"} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
          )}
        </div>
      ))}
      <Btn onClick={() => onSubmit(vals)}>{submitLabel}</Btn>
    </div>
  );
}

function ReadTab({ book, chapter, setChapter, onAbrirEstudo }) {
  const [state, setState] = useState("loading");
  const [verses, setVerses] = useState([]);
  const [marks, setMarks] = useState({});
  const [activeColor, setActiveColor] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState(null);
  const [noteFor, setNoteFor] = useState(null); // { verseNumber, trecho, color } | null
  const [noteText, setNoteText] = useState("");
  const [speed, setSpeed] = useState(1);
  const [shareFor, setShareFor] = useState(null); // versículo escolhido para compartilhar
  const [shareInfo, setShareInfo] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setMarks(loadMarksLocal(book.abbr, chapter));
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingVerse(null);
    fetchChapter(book.abbr, chapter)
      .then((data) => {
        if (cancelled) return;
        setVerses(data.verses || []);
        setState("ok");
        saveUltimaLeituraLocal(book, chapter, data.verses || []);
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [book.abbr, chapter]);

  const toggleReading = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingVerse(null);
      return;
    }
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
    let idx = 0;
    const speakNext = () => {
      if (idx >= verses.length) {
        setSpeaking(false);
        setSpeakingVerse(null);
        return;
      }
      const v = verses[idx];
      setSpeakingVerse(v.number);
      const utter = new SpeechSynthesisUtterance(`${v.number}. ${v.text}`);
      utter.lang = "pt-BR";
      if (ptVoice) utter.voice = ptVoice;
      utter.rate = speed;
      utter.onend = () => {
        idx += 1;
        speakNext();
      };
      utter.onerror = () => {
        setSpeaking(false);
        setSpeakingVerse(null);
      };
      window.speechSynthesis.speak(utter);
    };
    setSpeaking(true);
    speakNext();
  };

  const createMarkFromSelection = (v) => {
    if (!activeColor) return;
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";
    if (!selectedText) return;
    const start = v.text.indexOf(selectedText);
    if (start === -1) {
      sel.removeAllRanges();
      return;
    }
    const end = start + selectedText.length;
    setMarks((prev) => {
      const list = prev[v.number] || [];
      const next = { ...prev, [v.number]: [...list, { id: uid(), start, end, color: activeColor }] };
      saveMarksLocal(book.abbr, chapter, next);
      return next;
    });
    sel.removeAllRanges();
  };

  const removeMark = (verseNumber, markId) => {
    setMarks((prev) => {
      const next = { ...prev, [verseNumber]: (prev[verseNumber] || []).filter((m) => m.id !== markId) };
      saveMarksLocal(book.abbr, chapter, next);
      return next;
    });
  };

  const saveNoteForMark = () => {
    if (!noteText.trim() || !noteFor) return;
    const notes = loadNotesLocal();
    const next = [
      { id: uid(), texto: noteText.trim(), referencia: `${book.name} ${chapter}:${noteFor.verseNumber}`, trecho: noteFor.trecho, cor: noteFor.color, data: new Date().toISOString() },
      ...notes,
    ];
    saveNotesLocal(next);
    setNoteText("");
    setNoteFor(null);
  };

  const shareVerse = (v) => {
    setShareInfo("");
    setShareFor(v);
  };

  // Opção 1 — cartão em imagem (arte pequena + fundo em cor)
  const shareCard = async (v) => {
    const reference = `${book.name} ${chapter}:${v.number}`;
    const fallbackTextShare = () => {
      const phrase = CARD_OPENING_PHRASES[Math.floor(Math.random() * CARD_OPENING_PHRASES.length)];
      const text = `${phrase}\n\n"${v.text}" — ${reference}\n\n${CARD_FOOTER}`;
      if (navigator.share) {
        navigator.share({ text }).catch(() => {});
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    };
    try {
      setShareInfo("Preparando o cartão...");
      const blob = await generateVerseCard(v.text, reference);
      const file = new File([blob], `versiculo-${book.abbr}-${chapter}-${v.number}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        setShareFor(null);
        await navigator.share({ files: [file], text: reference });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      setShareFor(null);
      window.open(`https://wa.me/?text=${encodeURIComponent(`Baixei um cartão com este versículo (${reference}). ${CARD_FOOTER}`)}`, "_blank");
    } catch (e) {
      setShareFor(null);
      if (e && e.name === "AbortError") return;
      fallbackTextShare();
    } finally {
      setShareInfo("");
    }
  };

  // Opção 2 — link que abre uma tela com efeito e música para quem recebe
  const linkDoVersiculo = (v) =>
    buildShareLink({ ref: `${book.name} ${chapter}:${v.number}`, text: v.text, abbr: book.abbr, chapter, verse: v.number });

  const shareLink = (v) => {
    const reference = `${book.name} ${chapter}:${v.number}`;
    const link = linkDoVersiculo(v);
    const text = `🎵 Uma palavra de Deus para você — ${reference}\n\nToque para abrir (ligue o som):\n${link}`;
    setShareFor(null);
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const copyLink = async (v) => {
    const link = linkDoVersiculo(v);
    try {
      await navigator.clipboard.writeText(link);
      setShareInfo("Link copiado! Cole na conversa.");
    } catch (e) {
      window.prompt("Copie o link:", link);
    }
  };

  const exportChapterPDF = () => {
    const rows = verses
      .map((v) => {
        const vMarks = marks[v.number] || [];
        let html = v.text;
        if (vMarks.length) {
          const sorted = [...vMarks].sort((a, b) => a.start - b.start);
          html = "";
          let cursor = 0;
          sorted.forEach((m) => {
            html += v.text.slice(cursor, m.start);
            html += `<span style="background:${m.color}77;border:1px solid ${m.color};border-radius:3px;padding:0 2px;">${v.text.slice(m.start, m.end)}</span>`;
            cursor = m.end;
          });
          html += v.text.slice(cursor);
        }
        return `<p class="verso"><span class="num">${v.number}</span>${html}</p>`;
      })
      .join("");
    printPage(`${book.name} ${chapter} — Bíblia Avivar`, rows);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <button disabled={chapter <= 1} onClick={() => setChapter((c) => c - 1)} className="p-2 rounded-md disabled:opacity-30 focus:outline-none focus:ring-2" style={{ color: C.goldDeep }}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{book.name} {chapter}</p>
          <span className="text-xs font-mono" style={{ color: C.stone }}>{chapter} de {book.chapters} capítulos</span>
        </div>
        <button disabled={chapter >= book.chapters} onClick={() => setChapter((c) => c + 1)} className="p-2 rounded-md disabled:opacity-30 focus:outline-none focus:ring-2" style={{ color: C.goldDeep }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {onAbrirEstudo && (
        <div className="flex justify-center mb-4">
          <button onClick={onAbrirEstudo} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: "#7B5CB214", color: "#4B3B77", border: "1px solid #7B5CB240" }}>
            <GraduationCap size={13} /> Estudo Avivar
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2 p-2.5 rounded-lg" style={{ background: C.parchment }}>
        <Highlighter size={15} color={C.stone} />
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveColor(activeColor === c.color ? null : c.color)}
            className="w-6 h-6 rounded-full border-2 focus:outline-none"
            style={{ background: c.color, borderColor: activeColor === c.color ? C.ink : "transparent" }}
            title={`Marcar em ${c.key}`}
          />
        ))}
        {activeColor && <span className="text-xs" style={{ color: C.stone }}>selecione o trecho no texto</span>}
        <div className="flex-1" />
        <button onClick={toggleReading} className="text-xs flex items-center gap-1 px-2 py-1 rounded" style={{ color: speaking ? "#B03428" : C.goldDeep }}>
          {speaking ? <><Square size={12} /> Parar</> : <><Volume2 size={13} /> Ouvir</>}
        </button>
        {[0.75, 1, 1.25, 1.5].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="text-[10px] font-semibold rounded-full px-2 py-1"
            style={{ background: speed === s ? C.gold : "transparent", color: speed === s ? "#fff" : C.stone, border: `1px solid ${C.gold}55` }}
          >
            {String(s).replace(".", ",")}x
          </button>
        ))}
        <button onClick={exportChapterPDF} className="text-xs flex items-center gap-1 px-2 py-1 rounded" style={{ color: C.goldDeep }}>
          <Download size={13} /> PDF
        </button>
      </div>
      {activeColor && <p className="text-[11px] mb-4 italic" style={{ color: C.stone }}>Dica: arraste o dedo/mouse sobre a frase que quer marcar (não precisa ser o versículo inteiro).</p>}

      {state === "loading" && (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: C.stone }}>
          <Loader2 size={16} className="animate-spin" /> Carregando texto...
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-2 text-sm py-10 text-center rounded-lg border border-dashed" style={{ color: C.stone, borderColor: C.line }}>
          <AlertCircle size={20} />
          <p>Não foi possível carregar o texto agora.</p>
          <p className="text-xs max-w-sm">Verifique sua conexão. Enquanto isso, as abas "Estudo" e "História" deste livro continuam disponíveis normalmente.</p>
        </div>
      )}

      {state === "ok" && (
        <div className="space-y-2.5" style={{ color: "#241F30" }}>
          {verses.map((v) => (
            <div key={v.number} className="flex items-start gap-2 group">
              <p
                onMouseUp={() => createMarkFromSelection(v)}
                className="flex-1 rounded px-1 -mx-1"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  lineHeight: 1.85,
                  background: speakingVerse === v.number ? C.gold + "33" : "transparent",
                  boxShadow: speakingVerse === v.number ? `inset 2px 0 0 ${C.gold}` : "none",
                  cursor: activeColor ? "text" : "default",
                }}
              >
                <span className="text-xs font-mono align-super mr-1" style={{ color: "#B79A55" }}>{v.number}</span>
                <VerseText text={v.text} verseMarks={marks[v.number]} onRemoveMark={(markId) => removeMark(v.number, markId)} />
              </p>
              <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition shrink-0 pt-1">
                <button onClick={() => shareVerse(v)} className="p-1" title="Compartilhar versículo">
                  <Share2 size={14} color={C.goldDeep} />
                </button>
                {(marks[v.number] || []).length > 0 && (
                  <button
                    onClick={() => {
                      const last = marks[v.number][marks[v.number].length - 1];
                      setNoteFor({ verseNumber: v.number, trecho: v.text.slice(last.start, last.end), color: last.color });
                    }}
                    className="p-1"
                    title="Anotar sobre o trecho marcado"
                  >
                    <StickyNote size={14} color={C.goldDeep} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {shareFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000077" }} onClick={() => setShareFor(null)}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-mono" style={{ color: C.stone }}>{book.name} {chapter}:{shareFor.number}</p>
            <p className="text-sm italic mt-1 mb-4 line-clamp-3" style={{ color: C.ink }}>"{shareFor.text}"</p>
            <div className="space-y-2">
              <button onClick={() => shareLink(shareFor)} className="w-full text-left rounded-xl p-3 flex items-center gap-3" style={{ background: "linear-gradient(120deg,#1A1030,#3A2563)", color: "#F3E6B8" }}>
                <Sparkles size={20} color={C.goldBright} />
                <span><b className="text-sm block">Enviar com efeito e música</b><span className="text-xs" style={{ color: "#C9C2D8" }}>Quem receber toca no link e vê a mensagem animada, com harpa de fundo.</span></span>
              </button>
              <button onClick={() => shareCard(shareFor)} className="w-full text-left rounded-xl p-3 flex items-center gap-3 border" style={{ borderColor: C.gold + "66", background: C.cream, color: C.ink }}>
                <ImageIcon size={20} color={C.goldDeep} />
                <span><b className="text-sm block">Enviar como imagem</b><span className="text-xs" style={{ color: C.stone }}>Cartão com fundo colorido, pronto para status e conversas.</span></span>
              </button>
              <button onClick={() => copyLink(shareFor)} className="w-full text-left rounded-xl p-3 flex items-center gap-3 border" style={{ borderColor: C.line, background: C.cream, color: C.ink }}>
                <Link2 size={20} color={C.goldDeep} />
                <span><b className="text-sm block">Copiar link</b><span className="text-xs" style={{ color: C.stone }}>Para colar onde você quiser.</span></span>
              </button>
            </div>
            {shareInfo && <p className="text-xs mt-3 text-center" style={{ color: C.goldDeep }}>{shareInfo}</p>}
            <button onClick={() => setShareFor(null)} className="w-full text-center text-xs mt-3 py-1" style={{ color: C.stone }}>Cancelar</button>
          </div>
        </div>
      )}

      {noteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000077" }}>
          <div className="w-full max-w-sm rounded-xl p-5" style={{ background: "#fff", borderLeft: `5px solid ${noteFor.color}` }}>
            <p className="text-xs font-mono mb-1" style={{ color: C.stone }}>{book.name} {chapter}:{noteFor.verseNumber}</p>
            <p className="text-sm italic mb-3" style={{ color: C.ink }}>"{noteFor.trecho}"</p>
            <textarea autoFocus rows={4} placeholder="O que essa passagem significa pra você?" value={noteText} onChange={(e) => setNoteText(e.target.value)} className={inputCls} />
            <div className="flex gap-2 mt-3">
              <Btn onClick={saveNoteForMark}>Salvar observação</Btn>
              <Btn variant="ghost" color={C.stone} onClick={() => { setNoteFor(null); setNoteText(""); }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudyTab({ book, study, saveStudy, adminMode }) {
  const [editing, setEditing] = useState(false);
  if (!study && !adminMode) {
    return <div className="py-10 text-sm italic text-center rounded-lg border border-dashed" style={{ color: C.stone, borderColor: C.line }}>Estudo deste livro ainda não publicado.</div>;
  }
  if (editing || (!study && adminMode)) {
    return (
      <DynamicForm
        fields={STUDY_FIELDS}
        initial={study || {}}
        submitLabel="Publicar estudo"
        onSubmit={(v) => {
          saveStudy(book.abbr, v);
          setEditing(false);
        }}
      />
    );
  }
  return (
    <div>
      {study.imageUrl ? (
        <img src={study.imageUrl} alt={study.titulo} className="w-full h-56 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center" style={{ background: C.parchment }}>
          <ImageIcon size={22} color={C.stone} />
        </div>
      )}
      <h3 className="font-display text-xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{study.titulo}</h3>
      <p className="text-sm mt-3 leading-relaxed whitespace-pre-line" style={{ color: C.ink }}>{study.texto}</p>
      {adminMode && (
        <button onClick={() => setEditing(true)} className="text-xs underline mt-4" style={{ color: C.goldDeep }}>
          editar estudo
        </button>
      )}
    </div>
  );
}

function HistoryTab({ book }) {
  const h = BOOK_HISTORY[book.abbr];
  if (!h) {
    return <div className="py-10 text-sm italic text-center rounded-lg border border-dashed" style={{ color: C.stone, borderColor: C.line }}>Histórico deste livro ainda não cadastrado.</div>;
  }
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-lg" style={{ background: C.parchment }}>
          <p className="text-[10px] font-mono uppercase" style={{ color: C.stone }}>Autor tradicional</p>
          <p className="text-sm font-medium mt-0.5">{h.autor}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: C.parchment }}>
          <p className="text-[10px] font-mono uppercase" style={{ color: C.stone }}>Época</p>
          <p className="text-sm font-medium mt-0.5">{h.epoca}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: C.parchment }}>
          <p className="text-[10px] font-mono uppercase" style={{ color: C.stone }}>Tema central</p>
          <p className="text-sm font-medium mt-0.5">{h.tema}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{h.texto}</p>
    </div>
  );
}

/* Modo "livro físico": capa com o histórico numa moldura, depois um
   capítulo por página, virando com um toque/clique nas bordas. Usa a
   mesma marcação por trecho e leitura em voz do modo normal. */
function BookReaderView({ book, onExit }) {
  const [pageIdx, setPageIdx] = useState(0); // 0 = capa; 1..N = capítulos
  const [verses, setVerses] = useState([]);
  const [state, setState] = useState("ok");
  const [marks, setMarks] = useState({});
  const [activeColor, setActiveColor] = useState(null);
  const [flip, setFlip] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState("");

  const totalPages = book.chapters + 1;
  const isCover = pageIdx === 0;
  const chapterNum = pageIdx;
  const h = BOOK_HISTORY[book.abbr];

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingVerse(null);
    if (isCover) {
      setState("ok");
      return;
    }
    let cancelled = false;
    setState("loading");
    setMarks(loadMarksLocal(book.abbr, chapterNum));
    fetchChapter(book.abbr, chapterNum)
      .then((data) => {
        if (cancelled) return;
        setVerses(data.verses || []);
        setState("ok");
        saveUltimaLeituraLocal(book, chapterNum, data.verses || []);
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [pageIdx]);

  const goTo = (newIdx, dir) => {
    if (newIdx < 0 || newIdx >= totalPages) return;
    setFlip(dir);
    setTimeout(() => {
      setPageIdx(newIdx);
      setFlip(null);
    }, 220);
  };

  const toggleReading = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingVerse(null);
      return;
    }
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
    let idx = 0;
    const speakNext = () => {
      if (idx >= verses.length) {
        setSpeaking(false);
        setSpeakingVerse(null);
        return;
      }
      const v = verses[idx];
      setSpeakingVerse(v.number);
      const utter = new SpeechSynthesisUtterance(`${v.number}. ${v.text}`);
      utter.lang = "pt-BR";
      if (ptVoice) utter.voice = ptVoice;
      utter.rate = 0.95;
      utter.onend = () => {
        idx += 1;
        speakNext();
      };
      utter.onerror = () => {
        setSpeaking(false);
        setSpeakingVerse(null);
      };
      window.speechSynthesis.speak(utter);
    };
    setSpeaking(true);
    speakNext();
  };

  const createMarkFromSelection = (v) => {
    if (!activeColor) return;
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";
    if (!selectedText) return;
    const start = v.text.indexOf(selectedText);
    if (start === -1) {
      sel.removeAllRanges();
      return;
    }
    const end = start + selectedText.length;
    setMarks((prev) => {
      const list = prev[v.number] || [];
      const next = { ...prev, [v.number]: [...list, { id: uid(), start, end, color: activeColor }] };
      saveMarksLocal(book.abbr, chapterNum, next);
      return next;
    });
    sel.removeAllRanges();
  };

  const removeMark = (verseNumber, markId) => {
    setMarks((prev) => {
      const next = { ...prev, [verseNumber]: (prev[verseNumber] || []).filter((m) => m.id !== markId) };
      saveMarksLocal(book.abbr, chapterNum, next);
      return next;
    });
  };

  const saveNoteForMark = () => {
    if (!noteText.trim() || !noteFor) return;
    const notes = loadNotesLocal();
    const next = [
      { id: uid(), texto: noteText.trim(), referencia: `${book.name} ${chapterNum}:${noteFor.verseNumber}`, trecho: noteFor.trecho, cor: noteFor.color, data: new Date().toISOString() },
      ...notes,
    ];
    saveNotesLocal(next);
    setNoteText("");
    setNoteFor(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#2B2620" }}>
      <div className="flex items-center justify-between p-3 shrink-0" style={{ background: C.black }}>
        <button onClick={onExit} className="text-sm flex items-center gap-1.5" style={{ color: C.gold }}>
          <ArrowLeft size={16} /> Sair do modo livro
        </button>
        <span className="text-xs font-mono" style={{ color: "#ffffff88" }}>{isCover ? "Capa" : `Capítulo ${chapterNum} de ${book.chapters}`}</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-8 overflow-hidden">
        <div
          className="w-full max-w-2xl h-full rounded-lg shadow-2xl overflow-y-auto relative"
          style={{
            background: isCover ? "linear-gradient(160deg, #1F1B2E, #0B0B0C)" : C.cream,
            border: isCover ? `6px double ${C.gold}` : `1px solid ${C.line}`,
            padding: isCover ? "36px 28px" : "28px 22px",
            transform: flip === "next" ? "rotateY(-6deg) scale(0.97)" : flip === "prev" ? "rotateY(6deg) scale(0.97)" : "none",
            opacity: flip ? 0.5 : 1,
            transition: "transform 0.22s ease, opacity 0.22s ease",
          }}
        >
          {isCover ? (
            <div className="h-full flex flex-col justify-center text-center">
              <p className="text-[11px] font-mono tracking-[0.3em] mb-4" style={{ color: C.gold }}>MINISTÉRIO AVIVAR DO ESPÍRITO</p>
              <h1 className="font-display text-4xl font-bold mb-6" style={{ color: C.goldBright, fontFamily: "'Playfair Display', serif" }}>{book.name}</h1>
              {h ? (
                <div className="text-left mt-2 space-y-3 max-w-md mx-auto">
                  <p className="text-sm" style={{ color: "#E8E2D0" }}><strong style={{ color: C.gold }}>Autor tradicional:</strong> {h.autor}</p>
                  <p className="text-sm" style={{ color: "#E8E2D0" }}><strong style={{ color: C.gold }}>Época:</strong> {h.epoca}</p>
                  <p className="text-sm" style={{ color: "#E8E2D0" }}><strong style={{ color: C.gold }}>Tema:</strong> {h.tema}</p>
                  <p className="text-sm leading-relaxed mt-4" style={{ color: "#E8E2D0" }}>{h.texto}</p>
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: "#E8E2D0" }}>Histórico deste livro ainda não cadastrado.</p>
              )}
              <p className="text-xs font-mono mt-10" style={{ color: "#ffffff66" }}>{book.chapters} capítulos · toque na borda direita pra começar</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b sticky top-0" style={{ borderColor: C.line, background: C.cream }}>
                <Highlighter size={14} color={C.stone} />
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c.key} onClick={() => setActiveColor(activeColor === c.color ? null : c.color)} className="w-5 h-5 rounded-full border-2" style={{ background: c.color, borderColor: activeColor === c.color ? C.ink : "transparent" }} />
                ))}
                <div className="flex-1" />
                <button onClick={toggleReading} className="text-xs flex items-center gap-1" style={{ color: speaking ? "#B03428" : C.goldDeep }}>
                  {speaking ? <><Square size={12} /> Parar</> : <><Volume2 size={13} /> Ouvir</>}
                </button>
              </div>
              {state === "loading" && (
                <div className="text-center py-10 text-sm" style={{ color: C.stone }}>
                  <Loader2 className="animate-spin inline mr-2" size={16} />Carregando...
                </div>
              )}
              {state === "error" && <p className="text-center py-10 text-sm" style={{ color: C.stone }}>Não foi possível carregar este capítulo agora.</p>}
              {state === "ok" && (
                <div className="space-y-2" style={{ color: "#2B2620", fontFamily: "Georgia, serif" }}>
                  {verses.map((v) => (
                    <div key={v.number} className="flex items-start gap-2 group">
                      <p
                        onMouseUp={() => createMarkFromSelection(v)}
                        className="text-[16px] leading-relaxed flex-1 rounded px-1 -mx-1"
                        style={{ background: speakingVerse === v.number ? C.gold + "33" : "transparent", cursor: activeColor ? "text" : "default" }}
                      >
                        <span className="text-xs font-mono align-super mr-1" style={{ color: C.goldDeep }}>{v.number}</span>
                        <VerseText text={v.text} verseMarks={marks[v.number]} onRemoveMark={(markId) => removeMark(v.number, markId)} />
                      </p>
                      {(marks[v.number] || []).length > 0 && (
                        <button
                          onClick={() => {
                            const last = marks[v.number][marks[v.number].length - 1];
                            setNoteFor({ verseNumber: v.number, trecho: v.text.slice(last.start, last.end), color: last.color });
                          }}
                          className="opacity-40 group-hover:opacity-100 transition p-1 shrink-0"
                        >
                          <StickyNote size={13} color={C.stone} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={() => goTo(pageIdx - 1, "prev")} disabled={pageIdx === 0} className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 disabled:opacity-0 flex items-center justify-center focus:outline-none">
          <ChevronLeft size={22} color="#ffffff77" />
        </button>
        <button onClick={() => goTo(pageIdx + 1, "next")} disabled={pageIdx === totalPages - 1} className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 disabled:opacity-0 flex items-center justify-center focus:outline-none">
          <ChevronRight size={22} color="#ffffff77" />
        </button>
      </div>

      {noteFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "#00000088" }}>
          <div className="w-full max-w-sm rounded-xl p-5" style={{ background: "#fff", borderLeft: `5px solid ${noteFor.color}` }}>
            <p className="text-xs font-mono mb-1" style={{ color: C.stone }}>{book.name} {chapterNum}:{noteFor.verseNumber}</p>
            <p className="text-sm italic mb-3" style={{ color: C.ink }}>"{noteFor.trecho}"</p>
            <textarea autoFocus rows={4} placeholder="O que essa passagem significa pra você?" value={noteText} onChange={(e) => setNoteText(e.target.value)} className={inputCls} />
            <div className="flex gap-2 mt-3">
              <Btn onClick={saveNoteForMark}>Salvar observação</Btn>
              <Btn variant="ghost" color={C.stone} onClick={() => { setNoteFor(null); setNoteText(""); }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookView({ book, onBack, studies, saveStudy, adminMode, initialChapter, initialTab }) {
  const [tab, setTab] = useState(initialTab || "historia");
  const [chapter, setChapter] = useState(initialChapter || 1);
  const [bookMode, setBookMode] = useState(false);
  const study = studies[book.abbr];

  if (bookMode) {
    return <BookReaderView book={book} onExit={() => setBookMode(false)} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onClick={onBack} label="Voltar aos livros" />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Eyebrow>{book.chapters} capítulos</Eyebrow>
          <h1 className="font-display text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{book.name}</h1>
        </div>
        <Btn variant="ghost" onClick={() => setBookMode(true)}><BookOpen size={14} /> Ler como livro</Btn>
      </div>

      <div className="flex gap-2 mt-5 mb-6 flex-wrap">
        {[
          ["historia", "História"],
          ["ler", "Ler"],
          ["estudo", "Estudo"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: tab === k ? C.gold : "transparent", color: tab === k ? "#fff" : C.ink, border: `1px solid ${C.gold}55` }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "historia" && <HistoryTab book={book} />}
      {tab === "ler" && <ReadTab book={book} chapter={chapter} setChapter={setChapter} onAbrirEstudo={() => setTab("estudo")} />}
      {tab === "estudo" && <StudyTab book={book} study={study} saveStudy={saveStudy} adminMode={adminMode} />}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Configuração de música (admin)                                     */
/* ---------------------------------------------------------------- */
const DEFAULT_MUSICA = { tracks: [] };
const MUSICA_FIELDS = [
  { key: "nome", label: "Nome da faixa (ex: Instrumental suave)" },
  { key: "url", label: "URL do arquivo de áudio (mp3)", type: "url" },
];

function MusicaAdmin({ config, save }) {
  const add = (v) => {
    if (!v.nome || !v.url) return;
    save({ tracks: [...(config.tracks || []), { id: uid(), ...v }] });
  };
  const del = (id) => save({ tracks: (config.tracks || []).filter((t) => t.id !== id) });
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Eyebrow><Music size={12} className="inline mr-1" />Configuração</Eyebrow>
      <h1 className="font-display text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>Música de Fundo</h1>
      <p className="text-sm mt-2" style={{ color: C.stone }}>
        Cadastre links de arquivos de áudio (mp3) livres de direitos autorais. O player de música opcional (canto inferior direito) só aparece pros leitores quando existe pelo menos uma faixa cadastrada aqui.
      </p>
      <div className="mt-6 space-y-2">
        {(config.tracks || []).length === 0 && <p className="text-sm italic" style={{ color: C.stone }}>Nenhuma faixa cadastrada ainda.</p>}
        {(config.tracks || []).map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border text-sm" style={{ borderColor: C.line }}>
            <div>
              <p className="font-medium">{t.nome}</p>
              <p className="text-xs break-all" style={{ color: C.stone }}>{t.url}</p>
            </div>
            <button onClick={() => del(t.id)}><Trash2 size={14} color={C.stone} /></button>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <DynamicForm fields={MUSICA_FIELDS} onSubmit={add} submitLabel="Adicionar faixa" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* App                                                                */
/* ---------------------------------------------------------------- */
export default function App() {
  const [page, setPage] = useState("home");
  const [activeBook, setActiveBook] = useState(null);
  const [initialChapter, setInitialChapter] = useState(1);
  const [initialTab, setInitialTab] = useState("historia");
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [studies, setStudies] = useState({});
  const [musicaConfig, setMusicaConfig] = useState(DEFAULT_MUSICA);
  const [hinos, setHinos] = useState([]);
  const [msgRecebida, setMsgRecebida] = useState(readShareParam); // veio de um link com ?m=
  const [intro, setIntro] = useState(() => {
    try {
      return !readShareParam() && !sessionStorage.getItem("biblia:introVista");
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    // sem internet o carregamento não pode travar: depois de 4s segue com o que tiver
    const withTimeout = (p, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), 4000))]);
    (async () => {
      const storedStudies = await withTimeout(loadKey("biblia:studies", null), null);
      setStudies(storedStudies || SEED_STUDIES);
      setMusicaConfig(await withTimeout(loadKey("biblia:musicaconfig", DEFAULT_MUSICA), DEFAULT_MUSICA));
      let h = await withTimeout(loadKey("biblia:harpa", []), []);
      // se a Bíblia ainda não tem hinos próprios, usa a Harpa já importada no Louvor Avivar do Espírito (mesmo banco)
      if (!Array.isArray(h) || !h.length) h = await withTimeout(loadKey("avivar:harpa", []), []);
      setHinos(Array.isArray(h) ? h : []);
      setLoading(false);
    })();
  }, []);

  const fecharIntro = () => {
    try {
      sessionStorage.setItem("biblia:introVista", "1");
    } catch (e) {}
    setIntro(false);
  };
  const fecharMensagem = () => {
    setMsgRecebida(null);
    try {
      window.history.replaceState({}, "", "/");
    } catch (e) {}
  };
  const abrirLivro = (b, chapter, tab) => {
    setActiveBook(b);
    setInitialChapter(chapter || 1);
    setInitialTab(tab || "historia");
    setPage("book");
  };

  const saveStudy = (abbr, v) => {
    setStudies((prev) => {
      const next = { ...prev, [abbr]: v };
      saveKey("biblia:studies", next);
      return next;
    });
  };

  const saveHinos = (lista) => {
    setHinos(lista);
    saveKey("biblia:harpa", lista);
  };

  const saveMusicaConfig = (v) => {
    setMusicaConfig(v);
    saveKey("biblia:musicaconfig", v);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: "radial-gradient(ellipse at 50% 0%, #2B1D4A 0%, #0B0B0C 62%)", color: "#FBF6ED" }}>
        <img src="/logo-icone.png" alt="Ministério Avivar do Espírito" className="h-16 w-auto animate-pulse" />
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] mt-5" style={{ color: C.gold }}>Ministério Avivar do Espírito</p>
        <h1 className="text-3xl font-bold mt-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F3E6B8" }}>Bíblia Avivar</h1>
        <p className="text-xs mt-2" style={{ color: "#C9C2D8" }}>Bíblia Sagrada · Estudos · Harpa Cristã</p>
      </div>
    );
  }

  if (msgRecebida) {
    return (
      <ReceberMensagem
        msg={msgRecebida}
        onEnter={fecharMensagem}
        onOpenChapter={(m) => {
          const b = findBook(m.a);
          fecharMensagem();
          if (b) abrirLivro(b, Number(m.c) || 1, "ler");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: C.parchment, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap');
        .font-body { font-family: 'Public Sans', sans-serif; }
      `}</style>

      {intro && <IntroBoasVindas onEnter={fecharIntro} />}
      <InstalarModal />

      <NavBar
        onHome={() => setPage("home")}
        onAnotacoes={() => setPage("anotacoes")}
        adminMode={adminMode}
        onAdminClick={() => { if (adminMode) { privateLogout(); setAdminMode(false); } else setGateOpen(true); }}
      />

      {page === "home" && (
        <Home
          onOpenBook={abrirLivro}
          onAnotacoes={() => setPage("anotacoes")}
          onHarpa={() => { setPage("harpa"); window.scrollTo(0, 0); }}
        />
      )}
      {page === "book" && activeBook && (
        <BookView book={activeBook} onBack={() => setPage("home")} studies={studies} saveStudy={saveStudy} adminMode={adminMode} initialChapter={initialChapter} initialTab={initialTab} />
      )}
      {page === "anotacoes" && <AnotacoesPage onBack={() => setPage("home")} />}
      {page === "harpa" && <HarpaCristaPage onBack={() => setPage("home")} adminMode={adminMode} hinos={hinos} saveHinos={saveHinos} />}

      {adminMode && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <button onClick={() => setPage(page === "musica" ? "home" : "musica")} className="text-xs underline mb-4" style={{ color: C.goldDeep }}>
            {page === "musica" ? "← voltar" : "⚙ configurar música de fundo"}
          </button>
        </div>
      )}
      {page === "musica" && adminMode && <MusicaAdmin config={musicaConfig} save={saveMusicaConfig} />}

      <MusicPlayer config={musicaConfig} />

      {gateOpen && (
        <AdminGateModal
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setAdminMode(true);
            setGateOpen(false);
          }}
        />
      )}
    </div>
  );
}
