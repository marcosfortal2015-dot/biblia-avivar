import React, { useState, useEffect, useMemo } from "react";
import {
  Menu, X, Lock, ShieldCheck, ChevronLeft, ChevronRight, ArrowLeft,
  BookOpen, Search, Image as ImageIcon, Loader2, AlertCircle
} from "lucide-react";
import { storageGet, storageSet } from "./lib/storage.js";
import { OLD_TESTAMENT, NEW_TESTAMENT, ALL_BOOKS, findBook } from "./lib/bibleData.js";
import { SEED_STUDIES } from "./lib/seedStudies.js";

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

// ---- Configuração da API bíblica ----------------------------------
// A abibliadigital.com.br é gratuita e cobre português, mas exige um token
// (crie o seu de graça em abibliadigital.com.br/register e cole aqui).
// Antes de publicar publicamente, confirme os termos de uso da versão
// escolhida — traduções bíblicas modernas (NVI, por exemplo) têm direitos
// autorais próprios; ACF e RA costumam ter uso mais aberto no Brasil.
const BIBLE_API_BASE = "https://www.abibliadigital.com.br/api";
const BIBLE_API_TOKEN = ""; // <-- cole seu token gratuito aqui
const BIBLE_VERSION = "nvi";

const MASTER_ADMIN_PASSWORD = "biblia-avivar-2026"; // demo — trocar antes de publicar de verdade

const inputCls = "w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2";

async function loadKey(key, fallback) {
  try {
    const res = await storageGet(key);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return fallback;
}
async function saveKey(key, value) {
  try {
    await storageSet(key, JSON.stringify(value));
  } catch (e) {
    console.error("Falha ao salvar", key, e);
  }
}

async function fetchChapterFromApi(bookAbbr, chapter) {
  const res = await fetch(`${BIBLE_API_BASE}/verses/${BIBLE_VERSION}/${bookAbbr}/${chapter}`, {
    headers: BIBLE_API_TOKEN ? { Authorization: `Bearer ${BIBLE_API_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error("Falha ao buscar capítulo (API com token)");
  return res.json(); // esperado: { verses: [{ number, text }] }
}

// ---- Fonte alternativa, sem cadastro nem token -----------------------
// Baixa o arquivo JSON completo de uma tradução (projeto open-source
// thiagobodruk/biblia, espelhado via jsdelivr) uma única vez, guarda em
// memória, e fatia o capítulo pedido. Não depende de nenhuma conta.
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
        staticBiblePromise = null; // permite tentar de novo na próxima chamada
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

// Tenta primeiro a fonte sem cadastro (mais simples de manter no ar); se
// falhar por qualquer motivo, tenta a API com token como plano B.
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

function NavBar({ onHome, adminMode, onAdminClick }) {
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: C.black, borderColor: C.gold + "55" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={onHome} className="flex items-center gap-3 focus:outline-none focus:ring-2 rounded-md p-1">
          <img src="/logo-icone.png" alt="Bíblia Avivar" className="h-10 w-auto" />
          <span className="font-display font-semibold text-lg" style={{ color: C.goldBright, fontFamily: "'Playfair Display', serif" }}>Bíblia Avivar</span>
        </button>
        <button onClick={onAdminClick} className="p-2 rounded-full focus:outline-none focus:ring-2" title={adminMode ? "Sair do modo admin" : "Entrar como admin"} style={{ background: adminMode ? C.gold : "transparent", color: adminMode ? C.black : C.gold }}>
          {adminMode ? <ShieldCheck size={18} /> : <Lock size={18} />}
        </button>
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
      <p className="text-sm mt-2" style={{ color: C.stone }}>Leia a Palavra e explore o estudo de cada livro, capítulo por capítulo.</p>

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
/* Livro — capítulos, leitura e estudo                                */
/* ---------------------------------------------------------------- */
const STUDY_FIELDS = [
  { key: "titulo", label: "Título do estudo" },
  { key: "imageUrl", label: "URL de imagem (opcional)", type: "url" },
  { key: "texto", label: "Texto do estudo", type: "textarea" },
];

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
  const [state, setState] = useState("loading"); // loading | ok | error
  const [verses, setVerses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
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
    };
  }, [book.abbr, chapter]);

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

      {state === "loading" && (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: C.stone }}>
          <Loader2 size={16} className="animate-spin" /> Carregando texto...
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-2 text-sm py-10 text-center rounded-lg border border-dashed" style={{ color: C.stone, borderColor: C.line }}>
          <AlertCircle size={20} />
          <p>Não foi possível carregar o texto agora.</p>
          <p className="text-xs max-w-sm">
            Verifique sua conexão, ou se o token da API bíblica já foi configurado (veja o README). Enquanto isso, a aba
            "Estudo" deste livro continua disponível normalmente.
          </p>
        </div>
      )}

      {state === "ok" && (
        <div className="space-y-2 leading-relaxed" style={{ color: C.ink }}>
          {verses.map((v) => (
            <p key={v.number} className="text-[15px]">
              <span className="text-xs font-mono align-super mr-1" style={{ color: C.goldDeep }}>{v.number}</span>
              {v.text}
            </p>
          ))}
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

function BookView({ book, onBack, studies, saveStudy, adminMode }) {
  const [tab, setTab] = useState("ler");
  const [chapter, setChapter] = useState(1);
  const study = studies[book.abbr];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onClick={onBack} label="Voltar aos livros" />
      <Eyebrow>{book.chapters} capítulos</Eyebrow>
      <h1 className="font-display text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{book.name}</h1>

      <div className="flex gap-2 mt-5 mb-6">
        {[
          ["ler", "Ler"],
          ["estudo", "Estudo"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: tab === k ? C.gold : "transparent", color: tab === k ? "#fff" : C.ink, border: `1px solid ${C.gold}55` }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "ler" && <ReadTab book={book} chapter={chapter} setChapter={setChapter} />}
      {tab === "estudo" && <StudyTab book={book} study={study} saveStudy={saveStudy} adminMode={adminMode} />}
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

  useEffect(() => {
    (async () => {
      const stored = await loadKey("biblia:studies", null);
      setStudies(stored || SEED_STUDIES);
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

      <NavBar onHome={() => setPage("home")} adminMode={adminMode} onAdminClick={() => (adminMode ? setAdminMode(false) : setGateOpen(true))} />

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
