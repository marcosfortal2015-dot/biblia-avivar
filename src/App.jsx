import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Menu, X, Lock, ShieldCheck, ChevronLeft, ChevronRight, ArrowLeft,
  BookOpen, Search, Image as ImageIcon, Loader2, AlertCircle,
  Highlighter, Share2, Download, Music, Play, Pause, StickyNote, Trash2, Plus, Volume2, Square
} from "lucide-react";
import { storageGet, storageSet } from "./lib/storage.js";
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

// ---- Configuração da API bíblica ----------------------------------
const BIBLE_API_BASE = "https://www.abibliadigital.com.br/api";
const BIBLE_API_TOKEN = ""; // <-- cole seu token gratuito aqui (opcional, plano B)
const BIBLE_VERSION = "nvi";

const MASTER_ADMIN_PASSWORD = "biblia-avivar-2026"; // demo — trocar antes de publicar de verdade

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

function generateVerseCard(verseText, reference) {
  return new Promise((resolve, reject) => {
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => {
      drawImageCover(ctx, bgImg, 0, 0, size, size);
      // Escurece o meio/baixo pra o texto ficar legível em qualquer fundo (claro ou escuro)
      const grad = ctx.createLinearGradient(0, size * 0.28, 0, size * 0.92);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.45, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      ctx.textAlign = "center";

      const phrase = CARD_OPENING_PHRASES[Math.floor(Math.random() * CARD_OPENING_PHRASES.length)];

      ctx.font = "italic 32px Georgia";
      const phraseLines = wrapCanvasLines(ctx, phrase, 760);

      ctx.font = "38px Georgia";
      const verseLines = wrapCanvasLines(ctx, `"${verseText}"`, 860);

      const phraseLH = 44, verseLH = 50, gap1 = 34, gap2 = 26, refLH = 0;
      const totalHeight = phraseLines.length * phraseLH + gap1 + verseLines.length * verseLH + gap2 + 30;
      let curY = size / 2 - totalHeight / 2 + 90;

      ctx.font = "italic 32px Georgia";
      ctx.fillStyle = "#E9C765";
      phraseLines.forEach((l) => {
        ctx.fillText(l, size / 2, curY);
        curY += phraseLH;
      });

      curY += gap1;
      ctx.font = "38px Georgia";
      ctx.fillStyle = "#FBF6ED";
      verseLines.forEach((l) => {
        ctx.fillText(l, size / 2, curY);
        curY += verseLH;
      });

      curY += gap2;
      ctx.font = "bold 30px Georgia";
      ctx.fillStyle = "#CBA135";
      ctx.fillText(reference, size / 2, curY);

      ctx.font = "20px Georgia";
      ctx.fillStyle = "#C9B98A";
      ctx.fillText(CARD_FOOTER, size / 2, size - 70);

      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))), "image/png");
    };
    bgImg.onerror = () => reject(new Error("Falha ao carregar fundo do cartão"));
    bgImg.src = CARD_BACKGROUNDS[Math.floor(Math.random() * CARD_BACKGROUNDS.length)];
  });
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
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: C.black, borderColor: C.gold + "55" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={onHome} className="flex items-center gap-3 focus:outline-none focus:ring-2 rounded-md p-1">
          <img src="/logo-icone.png" alt="Bíblia Avivar" className="h-10 w-auto" />
          <span className="font-display font-semibold text-lg" style={{ color: C.goldBright, fontFamily: "'Playfair Display', serif" }}>Bíblia Avivar</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onAnotacoes} className="p-2 rounded-full focus:outline-none focus:ring-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.gold }} title="Minhas anotações">
            <StickyNote size={18} /> <span className="hidden sm:inline">Anotações</span>
          </button>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000088" }}>
      <div className="w-full max-w-sm rounded-xl p-6 border" style={{ background: C.black, borderColor: C.gold + "44" }}>
        <div className="flex items-center gap-2 mb-3" style={{ color: C.gold }}>
          <ShieldCheck size={20} />
          <h3 className="font-semibold text-lg text-white">Acesso administrativo</h3>
        </div>
        <input type="password" autoFocus placeholder="Senha master" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
        {err && <p className="text-xs mt-2" style={{ color: "#F2A6A6" }}>{err}</p>}
        <div className="flex gap-2 mt-4">
          <Btn onClick={() => (pw === MASTER_ADMIN_PASSWORD ? onSuccess() : setErr("Senha incorreta."))}>Entrar</Btn>
          <Btn variant="ghost" color={C.stone} onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Home — lista de livros                                             */
/* ---------------------------------------------------------------- */
function Home({ onOpenBook }) {
  const [testament, setTestament] = useState("at");
  const [query, setQuery] = useState("");
  const list = (testament === "at" ? OLD_TESTAMENT : NEW_TESTAMENT).filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Eyebrow>Ministério Avivar do Espírito</Eyebrow>
      <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>Bíblia Sagrada e Estudos</h1>
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

function ReadTab({ book, chapter, setChapter }) {
  const [state, setState] = useState("loading");
  const [verses, setVerses] = useState([]);
  const [marks, setMarks] = useState({});
  const [activeColor, setActiveColor] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState(null);
  const [noteFor, setNoteFor] = useState(null); // { verseNumber, trecho, color } | null
  const [noteText, setNoteText] = useState("");

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

  const shareVerse = async (v) => {
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
      const blob = await generateVerseCard(v.text, reference);
      const file = new File([blob], `versiculo-${book.abbr}-${chapter}-${v.number}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: reference });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      window.open(`https://wa.me/?text=${encodeURIComponent(`Baixei um cartão com este versículo (${reference}). ${CARD_FOOTER}`)}`, "_blank");
    } catch (e) {
      fallbackTextShare();
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
      <div className="flex items-center justify-between mb-4">
        <button disabled={chapter <= 1} onClick={() => setChapter((c) => c - 1)} className="p-2 rounded-md disabled:opacity-30 focus:outline-none focus:ring-2" style={{ color: C.goldDeep }}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-mono" style={{ color: C.stone }}>Capítulo {chapter} de {book.chapters}</span>
        <button disabled={chapter >= book.chapters} onClick={() => setChapter((c) => c + 1)} className="p-2 rounded-md disabled:opacity-30 focus:outline-none focus:ring-2" style={{ color: C.goldDeep }}>
          <ChevronRight size={18} />
        </button>
      </div>

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
        <div className="space-y-1 leading-relaxed" style={{ color: C.ink }}>
          {verses.map((v) => (
            <div key={v.number} className="flex items-start gap-2 group">
              <p
                onMouseUp={() => createMarkFromSelection(v)}
                className="text-[15px] flex-1 rounded px-1 -mx-1"
                style={{
                  background: speakingVerse === v.number ? C.gold + "33" : "transparent",
                  boxShadow: speakingVerse === v.number ? `inset 2px 0 0 ${C.gold}` : "none",
                  cursor: activeColor ? "text" : "default",
                }}
              >
                <span className="text-xs font-mono align-super mr-1" style={{ color: C.goldDeep }}>{v.number}</span>
                <VerseText text={v.text} verseMarks={marks[v.number]} onRemoveMark={(markId) => removeMark(v.number, markId)} />
              </p>
              <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition shrink-0">
                <button onClick={() => shareVerse(v)} className="p-1" title="Compartilhar versículo">
                  <Share2 size={13} color={C.stone} />
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
                    <StickyNote size={13} color={C.stone} />
                  </button>
                )}
              </div>
            </div>
          ))}
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

function BookView({ book, onBack, studies, saveStudy, adminMode }) {
  const [tab, setTab] = useState("historia");
  const [chapter, setChapter] = useState(1);
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
      {tab === "ler" && <ReadTab book={book} chapter={chapter} setChapter={setChapter} />}
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
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [studies, setStudies] = useState({});
  const [musicaConfig, setMusicaConfig] = useState(DEFAULT_MUSICA);

  useEffect(() => {
    (async () => {
      const storedStudies = await loadKey("biblia:studies", null);
      setStudies(storedStudies || SEED_STUDIES);
      setMusicaConfig(await loadKey("biblia:musicaconfig", DEFAULT_MUSICA));
      setLoading(false);
    })();
  }, []);

  const saveStudy = (abbr, v) => {
    setStudies((prev) => {
      const next = { ...prev, [abbr]: v };
      saveKey("biblia:studies", next);
      return next;
    });
  };

  const saveMusicaConfig = (v) => {
    setMusicaConfig(v);
    saveKey("biblia:musicaconfig", v);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.parchment }}>
        <img src="/logo-icone.png" className="h-10 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: C.parchment, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap');
        .font-body { font-family: 'Public Sans', sans-serif; }
      `}</style>

      <NavBar
        onHome={() => setPage("home")}
        onAnotacoes={() => setPage("anotacoes")}
        adminMode={adminMode}
        onAdminClick={() => (adminMode ? setAdminMode(false) : setGateOpen(true))}
      />

      {page === "home" && (
        <Home
          onOpenBook={(b) => {
            setActiveBook(b);
            setPage("book");
          }}
        />
      )}
      {page === "book" && activeBook && (
        <BookView book={activeBook} onBack={() => setPage("home")} studies={studies} saveStudy={saveStudy} adminMode={adminMode} />
      )}
      {page === "anotacoes" && <AnotacoesPage onBack={() => setPage("home")} />}

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
