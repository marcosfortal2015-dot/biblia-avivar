// Motor de sermões (somente administrador): a IA sugere temas, o pregador escolhe, a IA monta o esboço,
// e o pregador edita, guarda, duplica, apaga e baixa em PDF. Tudo fica na chave privada "biblia:sermoes".
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Copy, Download, Sparkles, Loader2, Search, ChevronUp, ChevronDown, FileText, Pencil, Save, Wand2, X } from "lucide-react";
import { privadoGet, privadoSet } from "./lib/storage.js";
import { iaLigada, iaPedir, MOTIVOS_IA } from "./lib/ia.js";
import { baixarPDF } from "./lib/pdf.js";
import { t, useIdioma } from "./lib/i18n.js";

const C = { ink: "#1F1B2E", parchment: "#FBF6ED", gold: "#CBA135", goldBright: "#E9C765", goldDeep: "#8B6F1F", stone: "#8A8272", line: "#00000018", violet: "#4B3B77", red: "#B03428" };
const CHAVE = "biblia:sermoes";

export const TIPOS = [
  ["familia", "Culto de família", "Culto de família (lar, crianças e adultos juntos)"],
  ["cura", "Cura e libertação", "Culto de cura e libertação"],
  ["doutrina", "Doutrina", "Ensino de doutrina cristã"],
  ["evangelismo", "Evangelismo", "Culto evangelístico"],
  ["ceia", "Santa Ceia", "Culto de Santa Ceia"],
  ["casais", "Casais e família", "Mensagem para casais e família"],
  ["jovens", "Jovens", "Culto de jovens"],
  ["celulas", "Células", "Reunião de célula / pequeno grupo"],
  ["oracao", "Campanha de oração", "Campanha de oração e jejum"],
  ["outro", "Outro", ""],
];
const nomeTipo = (id) => { const x = TIPOS.find((y) => y[0] === id); return x ? t("sermao.tipo." + id, x[1]) : id || ""; };
const uid = () => "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (d) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d || "");
const linhas = (txt) => String(txt || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);

export const sermaoVazio = () => ({ id: uid(), titulo: "", tema: "", textoBase: "", tipo: "outro", data: hoje(), introducao: "", pontos: [{ titulo: "", texto: "", versiculos: [], ilustracao: "" }], aplicacao: "", conclusao: "", apelo: "", perguntas: [], dicas: [], origem: "manual", criadoEm: Date.now(), atualizadoEm: Date.now() });

/* ------------------------- PDF ------------------------- */
export function blocosSermao(s, { cabecalho = true } = {}) {
  const b = [];
  b.push({ t: "h1", x: s.titulo || t("sermao.semTitulo", "(sem título)") });
  const meta = [nomeTipo(s.tipo), s.data ? dataBR(s.data) : "", s.textoBase ? t("sermao.textoBase", "Texto base") + ": " + s.textoBase : ""].filter(Boolean).join("  ·  ");
  if (meta) b.push({ t: "meta", x: meta });
  if (s.tema) b.push({ t: "p", x: t("sermao.tema", "Tema") + ": " + s.tema });
  b.push({ t: "hr", x: "" });
  if (s.introducao) { b.push({ t: "h2", x: t("sermao.introducao", "Introdução") }); linhas(s.introducao).forEach((x) => b.push({ t: "p", x })); }
  (s.pontos || []).forEach((p, i) => {
    b.push({ t: "h2", x: `${i + 1}. ${p.titulo || t("sermao.ponto", "Ponto")}` });
    linhas(p.texto).forEach((x) => b.push({ t: "p", x }));
    if (p.versiculos && p.versiculos.length) b.push({ t: "cit", x: t("sermao.versiculos", "Versículos") + ": " + p.versiculos.join("; ") });
    if (p.ilustracao) { b.push({ t: "h3", x: t("sermao.ilustracao", "Ilustração") }); linhas(p.ilustracao).forEach((x) => b.push({ t: "p", x })); }
  });
  [["aplicacao", "Aplicação"], ["conclusao", "Conclusão"], ["apelo", "Apelo"]].forEach(([k, r]) => {
    if (s[k]) { b.push({ t: "h2", x: t("sermao." + k, r) }); linhas(s[k]).forEach((x) => b.push({ t: "p", x })); }
  });
  if (s.perguntas && s.perguntas.length) { b.push({ t: "h2", x: t("sermao.perguntas", "Perguntas para refletir") }); s.perguntas.forEach((x) => b.push({ t: "li", x })); }
  if (s.dicas && s.dicas.length) { b.push({ t: "h2", x: t("sermao.dicas", "Dicas para a pregação") }); s.dicas.forEach((x) => b.push({ t: "li", x })); }
  return b;
}
export function pdfSermao(s) {
  return { titulo: "", subtitulo: "", rodape: "Bíblia Avivar — Ministério Avivar do Espírito", blocos: blocosSermao(s) };
}
export function pdfLista(lista, { completo = false } = {}) {
  const b = [];
  if (!completo) {
    lista.forEach((s, i) => {
      b.push({ t: "h2", x: `${i + 1}. ${s.titulo || t("sermao.semTitulo", "(sem título)")}` });
      b.push({ t: "meta", x: [nomeTipo(s.tipo), dataBR(s.data), s.textoBase].filter(Boolean).join("  ·  ") });
      if (s.tema) b.push({ t: "p", x: s.tema });
      if ((s.pontos || []).length) b.push({ t: "p", x: t("sermao.pontosLista", "Pontos") + ": " + s.pontos.map((p) => p.titulo).filter(Boolean).join(" · ") });
    });
  } else {
    lista.forEach((s, i) => { if (i) b.push({ t: "salto", x: "" }); blocosSermao(s).forEach((x) => b.push(x)); });
  }
  return { titulo: t("sermao.listaTitulo", "Meus sermões"), subtitulo: t("sermao.totalSermoes", "{n} sermões", { n: lista.length }) + " · " + new Date().toLocaleDateString(), rodape: "Bíblia Avivar — Ministério Avivar do Espírito", blocos: b };
}
const nomeArq = (s) => ("sermao-" + (s.titulo || "sem-titulo")).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/* ------------------------- peças de interface ------------------------- */
const Botao = ({ children, onClick, tom = "ouro", disabled, testid, titulo, pequeno }) => {
  const est = tom === "ouro" ? { background: C.gold, color: "#fff" } : tom === "escuro" ? { background: C.ink, color: C.goldBright } : tom === "perigo" ? { background: "#fff", color: C.red, border: `1px solid ${C.red}66` } : { background: "#fff", color: C.goldDeep, border: `1px solid ${C.gold}88` };
  return <button onClick={onClick} disabled={disabled} data-testid={testid} title={titulo} className={`inline-flex items-center gap-1.5 rounded-lg font-bold disabled:opacity-50 focus:outline-none focus:ring-2 ${pequeno ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"}`} style={est}>{children}</button>;
};
const Campo = ({ rotulo, children, ajuda }) => (<label className="block mb-3"><span className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.goldDeep }}>{rotulo}</span>{children}{ajuda && <span className="block text-[11px] mt-0.5" style={{ color: C.stone }}>{ajuda}</span>}</label>);
const estiloInput = { borderColor: C.line, background: "#fff", color: C.ink };
const Entrada = (p) => <input {...p} className="w-full rounded-md border px-3 py-2 text-sm" style={estiloInput} />;
const Area = ({ linhasMin = 4, ...p }) => <textarea rows={linhasMin} {...p} className="w-full rounded-md border px-3 py-2 text-sm leading-relaxed" style={estiloInput} />;

function msgIA(r) { const m = MOTIVOS_IA[r.motivo] || ["ia.falha", "Não consegui falar com a IA agora."]; return t(m[0], m[1]); }

/* ------------------------- gerador: tipo → temas → sermão ------------------------- */
// Estado do "motor" de IA do gerador de sermões: ligado quando o servidor tem a chave; senão mostra o passo a passo para conectar.
function PainelMotorIA({ ligada, aoTestar }) {
  const cor = ligada ? "#1f7a46" : ligada === false ? "#b36b00" : "#6b6480";
  const rotulo = ligada ? t("motor.ligado", "Motor de IA conectado e pronto") : ligada === false ? t("motor.desligado", "Motor de IA pronto, aguardando a chave") : t("motor.verificando", "Verificando o motor de IA…");
  return (
    <div className="rounded-xl p-3 mb-4" data-testid="painel-motor-ia" style={{ background: ligada ? "#EAF6EE" : "#FFF4E0", border: `1px solid ${cor}55` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cor }} />
        <p className="text-sm font-bold flex-1" style={{ color: cor }} data-testid={ligada === false ? "gerador-ia-off" : "gerador-ia-status"}>{rotulo}</p>
        <button onClick={aoTestar} data-testid="motor-testar" className="rounded-full px-3 py-1 text-xs font-bold border" style={{ borderColor: cor + "88", color: cor, background: "#fff" }}>{t("motor.testar", "Testar conexão")}</button>
      </div>
      {ligada === false && (
        <ol className="mt-2 text-[13px] leading-snug list-decimal pl-5 space-y-1" style={{ color: C.ink }}>
          <li>{t("motor.p1", "Abra a Vercel → projeto do site avivardoespirito → Settings → Environment Variables.")}</li>
          <li>{t("motor.p2", "Crie a variável")} <b>ANTHROPIC_API_KEY</b> {t("motor.p2b", "com a chave da sua conta Anthropic (console.anthropic.com → API Keys).")}</li>
          <li>{t("motor.p3", "Faça um novo deploy (Redeploy) e toque em “Testar conexão”. Pronto: os botões de sermão e de interpretação passam a funcionar.")}</li>
        </ol>
      )}
    </div>
  );
}

function Gerador({ aoSermao, aoCancelar }) {
  useIdioma();
  const [tipo, setTipo] = useState("familia");
  const [outro, setOutro] = useState("");
  const [publico, setPublico] = useState("");
  const [obs, setObs] = useState("");
  const [minutos, setMinutos] = useState(30);
  const [temas, setTemas] = useState(null);
  const [esc, setEsc] = useState(null);
  const [busy, setBusy] = useState("");
  const [erro, setErro] = useState("");
  const [ligada, setLigada] = useState(null);
  useEffect(() => { iaLigada().then(setLigada); }, []);
  const tipoTexto = () => (tipo === "outro" ? outro.trim() : (TIPOS.find((x) => x[0] === tipo) || [])[2]);
  const sugerir = async () => {
    if (!tipoTexto()) { setErro(t("sermao.dizTipo", "Escreva o tipo de culto ou mensagem.")); return; }
    setErro(""); setBusy("temas"); setTemas(null); setEsc(null);
    const r = await iaPedir("temas", { tipo: tipoTexto(), publico, quantidade: 6 });
    setBusy("");
    if (r.ok) setTemas(r.dados.temas); else setErro(msgIA(r));
  };
  const gerar = async () => {
    const tema = temas && temas[esc]; if (!tema) return;
    setErro(""); setBusy("sermao");
    const r = await iaPedir("sermao", { tema: tema.titulo, textoBase: tema.textoBase, passagens: tema.passagens, tipo: tipoTexto(), publico, minutos, observacoes: obs });
    setBusy("");
    if (r.ok) aoSermao({ ...sermaoVazio(), ...r.dados, tipo, origem: "ia", id: uid() }); else setErro(msgIA(r));
  };
  return (
    <div data-testid="gerador-sermao">
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{t("sermao.novoIA", "Novo sermão com ajuda da IA")}</h2>
      <p className="text-sm mb-4" style={{ color: C.stone }}>{t("sermao.passos", "1) Escolha o tipo · 2) A IA sugere temas com capítulos e versículos · 3) Você escolhe o tema · 4) A IA monta o esboço e você edita.")}</p>
      <PainelMotorIA ligada={ligada} aoTestar={() => { setLigada(null); iaLigada(true).then(setLigada); }} />
      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.goldDeep }}>{t("sermao.tipo", "Tipo de mensagem")}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {TIPOS.map(([id]) => (
          <button key={id} onClick={() => setTipo(id)} data-testid={"tipo-" + id} className="rounded-full px-3.5 py-1.5 text-sm font-semibold border focus:outline-none focus:ring-2" style={tipo === id ? { background: C.ink, color: C.goldBright, borderColor: C.ink } : { background: "#fff", color: C.ink, borderColor: C.gold + "88" }}>{nomeTipo(id)}</button>
        ))}
      </div>
      {tipo === "outro" && <Campo rotulo={t("sermao.qualTipo", "Qual tipo?")}><Entrada value={outro} onChange={(e) => setOutro(e.target.value)} placeholder={t("sermao.qualTipoDica", "ex.: culto de ação de graças")} data-testid="tipo-outro-campo" /></Campo>}
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Campo rotulo={t("sermao.publico", "Público (opcional)")}><Entrada value={publico} onChange={(e) => setPublico(e.target.value)} placeholder={t("sermao.publicoDica", "ex.: famílias com crianças")} /></Campo>
        <Campo rotulo={t("sermao.duracao", "Duração aproximada (minutos)")}><Entrada type="number" min={5} max={90} value={minutos} onChange={(e) => setMinutos(Math.max(5, Math.min(90, +e.target.value || 30)))} /></Campo>
      </div>
      <Campo rotulo={t("sermao.obs", "Observações (opcional)")} ajuda={t("sermao.obsAjuda", "Algo que a IA deve levar em conta: situação da igreja, versículo desejado, tom…")}><Area linhasMin={2} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
      <div className="flex flex-wrap gap-2 mb-4">
        <Botao onClick={sugerir} disabled={!!busy} testid="btn-sugerir-temas">{busy === "temas" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {temas ? t("sermao.sugerirOutros", "Sugerir outros temas") : t("sermao.sugerir", "Sugerir temas")}</Botao>
        <Botao tom="claro" onClick={aoCancelar} testid="btn-gerador-cancelar">{t("cancelar", "Cancelar")}</Botao>
      </div>
      {erro && <p className="text-sm mb-3" style={{ color: C.red }} data-testid="gerador-erro">{erro}</p>}
      {temas && (
        <div className="space-y-2.5 mb-4" data-testid="lista-temas">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.goldDeep }}>{t("sermao.escolhaTema", "Escolha um tema")}</p>
          {temas.map((x, i) => (
            <button key={i} onClick={() => setEsc(i)} data-testid={"tema-" + i} className="w-full text-left rounded-xl p-3.5 border-2 focus:outline-none focus:ring-2" style={{ background: esc === i ? "#CBA13522" : "#fff", borderColor: esc === i ? C.gold : C.line }}>
              <p className="font-bold" style={{ color: C.ink }}>{x.titulo}</p>
              <p className="text-sm mt-0.5" style={{ color: C.ink }}>{x.resumo}</p>
              <p className="text-xs mt-1.5" style={{ color: C.goldDeep }}><b>{t("sermao.textoBase", "Texto base")}:</b> {x.textoBase}{x.passagens.length ? " · " + x.passagens.map((p) => p.ref).join(" · ") : ""}</p>
            </button>
          ))}
          <Botao onClick={gerar} disabled={esc == null || !!busy} testid="btn-gerar-sermao">{busy === "sermao" ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} {busy === "sermao" ? t("sermao.montando", "Montando o sermão…") : t("sermao.gerar", "Gerar sermão com este tema")}</Botao>
        </div>
      )}
    </div>
  );
}

/* ------------------------- editor ------------------------- */
function Editor({ inicial, aoSalvar, aoCancelar, aoBaixar }) {
  useIdioma();
  const [s, setS] = useState(() => ({ ...sermaoVazio(), ...inicial, pontos: (inicial.pontos && inicial.pontos.length ? inicial.pontos : sermaoVazio().pontos).map((p) => ({ versiculos: [], ilustracao: "", ...p })) }));
  const [busy, setBusy] = useState("");
  const [erro, setErro] = useState("");
  const [sujo, setSujo] = useState(false);
  const set = (k, v) => { setS((x) => ({ ...x, [k]: v })); setSujo(true); };
  const setP = (i, k, v) => { setS((x) => ({ ...x, pontos: x.pontos.map((p, j) => (j === i ? { ...p, [k]: v } : p)) })); setSujo(true); };
  const mover = (i, d) => setS((x) => { const a = [...x.pontos]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; setSujo(true); return { ...x, pontos: a }; });
  const reescrever = async (secao, texto, aplicar) => {
    const ins = window.prompt(t("sermao.instrucaoIA", "Como a IA deve mudar este texto? (ex.: mais curto, mais simples, com um exemplo)"), "");
    if (!ins) return;
    setErro(""); setBusy(secao);
    const r = await iaPedir("reescrever", { secao, texto, instrucao: ins });
    setBusy("");
    if (r.ok) aplicar(r.dados.texto); else setErro(msgIA(r));
  };
  const BtnIA = ({ secao, texto, aplicar }) => <button onClick={() => reescrever(secao, texto, aplicar)} disabled={!texto || !!busy} className="inline-flex items-center gap-1 text-[11px] font-semibold underline disabled:opacity-40" style={{ color: C.violet }} data-testid={"ia-" + secao}>{busy === secao ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t("sermao.reescreverIA", "Reescrever com IA")}</button>;
  const salvar = () => {
    if (!s.titulo.trim()) { setErro(t("sermao.faltaTitulo", "Dê um título ao sermão antes de salvar.")); return; }
    aoSalvar({ ...s, titulo: s.titulo.trim(), atualizadoEm: Date.now() });
    setSujo(false);
  };
  return (
    <div data-testid="editor-sermao">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-display text-2xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{inicial.criadoEm && inicial.titulo ? t("sermao.editar", "Editar sermão") : t("sermao.novo", "Novo sermão")}</h2>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={salvar} testid="btn-salvar-sermao"><Save size={15} /> {t("salvar", "Salvar")}</Botao>
          <Botao tom="claro" onClick={() => aoBaixar(s)} testid="btn-pdf-editor"><Download size={15} /> PDF</Botao>
          <Botao tom="claro" onClick={() => { if (!sujo || window.confirm(t("sermao.descartar", "Descartar as alterações não salvas?"))) aoCancelar(); }} testid="btn-voltar-editor">{t("voltar", "Voltar")}</Botao>
        </div>
      </div>
      {erro && <p className="text-sm mb-3" style={{ color: C.red }} data-testid="editor-erro">{erro}</p>}
      <Campo rotulo={t("sermao.titulo", "Título")}><Entrada value={s.titulo} onChange={(e) => set("titulo", e.target.value)} data-testid="campo-titulo" /></Campo>
      <div className="grid sm:grid-cols-3 gap-x-4">
        <Campo rotulo={t("sermao.tipo", "Tipo de mensagem")}><select value={s.tipo} onChange={(e) => set("tipo", e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" style={estiloInput} data-testid="campo-tipo">{TIPOS.map(([id]) => <option key={id} value={id}>{nomeTipo(id)}</option>)}</select></Campo>
        <Campo rotulo={t("sermao.data", "Data")}><Entrada type="date" value={s.data} onChange={(e) => set("data", e.target.value)} /></Campo>
        <Campo rotulo={t("sermao.textoBase", "Texto base")}><Entrada value={s.textoBase} onChange={(e) => set("textoBase", e.target.value)} placeholder="Salmos 23" data-testid="campo-textobase" /></Campo>
      </div>
      <Campo rotulo={t("sermao.tema", "Tema")}><Entrada value={s.tema} onChange={(e) => set("tema", e.target.value)} /></Campo>
      <Campo rotulo={<span className="flex items-center justify-between"><span>{t("sermao.introducao", "Introdução")}</span><BtnIA secao="introdução" texto={s.introducao} aplicar={(x) => set("introducao", x)} /></span>}><Area value={s.introducao} onChange={(e) => set("introducao", e.target.value)} data-testid="campo-introducao" /></Campo>

      <p className="text-xs font-bold uppercase tracking-wider mt-5 mb-2" style={{ color: C.goldDeep }}>{t("sermao.pontos", "Pontos da mensagem")}</p>
      {s.pontos.map((p, i) => (
        <div key={i} className="rounded-xl p-3.5 mb-3 border" style={{ background: C.parchment, borderColor: C.gold + "55" }} data-testid={"ponto-" + i}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm" style={{ color: C.goldDeep }}>{t("sermao.ponto", "Ponto")} {i + 1}</span>
            <div className="flex gap-1">
              <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={t("sermao.subir", "Subir")} className="p-1 disabled:opacity-30"><ChevronUp size={16} /></button>
              <button onClick={() => mover(i, 1)} disabled={i === s.pontos.length - 1} aria-label={t("sermao.descer", "Descer")} className="p-1 disabled:opacity-30"><ChevronDown size={16} /></button>
              <button onClick={() => { setS((x) => ({ ...x, pontos: x.pontos.filter((_, j) => j !== i) })); setSujo(true); }} aria-label={t("sermao.removerPonto", "Remover ponto")} data-testid={"remover-ponto-" + i} className="p-1" style={{ color: C.red }}><Trash2 size={15} /></button>
            </div>
          </div>
          <Campo rotulo={t("sermao.titulo", "Título")}><Entrada value={p.titulo} onChange={(e) => setP(i, "titulo", e.target.value)} data-testid={"ponto-titulo-" + i} /></Campo>
          <Campo rotulo={<span className="flex items-center justify-between"><span>{t("sermao.desenvolvimento", "Desenvolvimento")}</span><BtnIA secao={"ponto " + (i + 1)} texto={p.texto} aplicar={(x) => setP(i, "texto", x)} /></span>}><Area linhasMin={5} value={p.texto} onChange={(e) => setP(i, "texto", e.target.value)} /></Campo>
          <Campo rotulo={t("sermao.versiculos", "Versículos")} ajuda={t("sermao.versiculosAjuda", "Separe por ponto e vírgula. Ex.: Jo 3:16; Rm 8:1")}><Entrada value={(p.versiculos || []).join("; ")} onChange={(e) => setP(i, "versiculos", e.target.value.split(";").map((x) => x.trim()).filter(Boolean))} /></Campo>
          <Campo rotulo={t("sermao.ilustracao", "Ilustração")}><Area linhasMin={2} value={p.ilustracao} onChange={(e) => setP(i, "ilustracao", e.target.value)} /></Campo>
        </div>
      ))}
      <div className="mb-5"><Botao tom="claro" onClick={() => { setS((x) => ({ ...x, pontos: [...x.pontos, { titulo: "", texto: "", versiculos: [], ilustracao: "" }] })); setSujo(true); }} testid="btn-add-ponto"><Plus size={15} /> {t("sermao.addPonto", "Adicionar ponto")}</Botao></div>

      {[["aplicacao", "Aplicação"], ["conclusao", "Conclusão"], ["apelo", "Apelo"]].map(([k, r]) => (
        <Campo key={k} rotulo={<span className="flex items-center justify-between"><span>{t("sermao." + k, r)}</span><BtnIA secao={r.toLowerCase()} texto={s[k]} aplicar={(x) => set(k, x)} /></span>}><Area value={s[k]} onChange={(e) => set(k, e.target.value)} data-testid={"campo-" + k} /></Campo>
      ))}
      <Campo rotulo={t("sermao.perguntas", "Perguntas para refletir")} ajuda={t("sermao.umaPorLinha", "Uma por linha.")}><Area value={(s.perguntas || []).join("\n")} onChange={(e) => set("perguntas", e.target.value.split("\n"))} onBlur={() => set("perguntas", linhas((s.perguntas || []).join("\n")))} /></Campo>
      <Campo rotulo={t("sermao.dicas", "Dicas para a pregação")} ajuda={t("sermao.umaPorLinha", "Uma por linha.")}><Area value={(s.dicas || []).join("\n")} onChange={(e) => set("dicas", e.target.value.split("\n"))} onBlur={() => set("dicas", linhas((s.dicas || []).join("\n")))} /></Campo>
      <div className="flex flex-wrap gap-2 mt-2"><Botao onClick={salvar} testid="btn-salvar-sermao-2"><Save size={15} /> {t("salvar", "Salvar")}</Botao></div>
    </div>
  );
}

/* ------------------------- página principal ------------------------- */
// carregarFn/gravarFn: de onde vêm e para onde vão os sermões. Padrão: os sermões do ministério (só administrador).
// Quem entrou com o código da área de sermões usa os próprios (guardados só para essa pessoa).
export default function SermoesPage({ onBack, carregarFn, gravarFn, selo }) {
  useIdioma();
  const [lista, setLista] = useState(null);
  const [erroCarga, setErroCarga] = useState("");
  const [tela, setTela] = useState("lista"); // lista | gerar | editor
  const [edit, setEdit] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busca, setBusca] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = async () => {
    setErroCarga(""); setLista(null);
    const r = await (carregarFn ? carregarFn() : privadoGet(CHAVE));
    if (r.ok) setLista(Array.isArray(r.value) ? r.value : []);
    else setErroCarga(r.motivo === "sem_sessao" ? t("sermao.semSessao", carregarFn ? "Entre na área de sermões para ver seus sermões." : "Entre como administrador para ver os sermões.") : t("sermao.falhaCarga", "Não consegui carregar os sermões. Nada foi apagado; tente de novo."));
  };
  useEffect(() => { carregar(); }, []);

  const gravar = async (nova) => {
    const r = await (gravarFn ? gravarFn(nova) : privadoSet(CHAVE, nova));
    if (r.ok) { setLista(nova); setAviso(""); return true; }
    setAviso(t("sermao.falhaSalvar", "Não consegui salvar agora. Confira a conexão e tente de novo."));
    return false;
  };
  const salvarSermao = async (s) => {
    const existe = lista.some((x) => x.id === s.id);
    const nova = existe ? lista.map((x) => (x.id === s.id ? s : x)) : [s, ...lista];
    if (await gravar(nova)) { setTela("lista"); setEdit(null); }
  };
  const apagar = async (s) => { if (window.confirm(t("sermao.confirmaApagar", "Apagar o sermão “{t}”? Isso não pode ser desfeito.", { t: s.titulo }))) await gravar(lista.filter((x) => x.id !== s.id)); };
  const duplicar = async (s) => { const c = { ...s, id: uid(), titulo: s.titulo + " " + t("sermao.copia", "(cópia)"), criadoEm: Date.now(), atualizadoEm: Date.now() }; await gravar([c, ...lista]); };

  const filtrada = useMemo(() => {
    if (!lista) return [];
    const q = busca.trim().toLowerCase();
    return lista.filter((s) => (!filtroTipo || s.tipo === filtroTipo) && (!q || [s.titulo, s.tema, s.textoBase, s.introducao, ...(s.pontos || []).map((p) => p.titulo + " " + p.texto)].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  }, [lista, busca, filtroTipo]);

  const Topo = (
    <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 focus:outline-none focus:ring-2 rounded-md px-1" style={{ color: C.goldDeep }} data-testid="sermoes-voltar"><ArrowLeft size={16} /> {t("voltar", "Voltar")}</button>
  );

  if (tela === "gerar") return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{Topo}<Gerador aoCancelar={() => setTela("lista")} aoSermao={(s) => { setEdit(s); setTela("editor"); }} /></div>;
  if (tela === "editor" && edit) return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{Topo}{aviso && <p className="text-sm mb-3" style={{ color: C.red }} data-testid="sermoes-aviso">{aviso}</p>}<Editor key={edit.id} inicial={edit} aoSalvar={salvarSermao} aoCancelar={() => { setTela("lista"); setEdit(null); }} aoBaixar={(s) => baixarPDF(nomeArq(s), pdfSermao(s))} /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8" data-testid="pagina-sermoes">
      {Topo}
      <p className="uppercase text-xs tracking-[0.2em] font-mono font-semibold" style={{ color: C.gold }}>{selo || t("sermao.admin", "Somente administrador")}</p>
      <h1 className="font-display text-3xl font-bold" style={{ color: C.ink, fontFamily: "'Playfair Display', serif" }}>{t("sermao.pagina", "Sermões")}</h1>
      <div className="flex flex-wrap gap-2 mt-4 mb-4">
        <Botao onClick={() => setTela("gerar")} disabled={!lista} testid="btn-novo-ia"><Sparkles size={15} /> {t("sermao.novoIA", "Novo sermão com ajuda da IA")}</Botao>
        <Botao tom="claro" onClick={() => { setEdit(sermaoVazio()); setTela("editor"); }} disabled={!lista} testid="btn-novo-manual"><Plus size={15} /> {t("sermao.novoManual", "Escrever do zero")}</Botao>
        {lista && lista.length > 0 && <>
          <Botao tom="claro" onClick={() => baixarPDF("meus-sermoes-lista", pdfLista(filtrada))} testid="btn-pdf-lista"><FileText size={15} /> {t("sermao.pdfLista", "PDF da lista")}</Botao>
          <Botao tom="claro" onClick={() => baixarPDF("meus-sermoes-completo", pdfLista(filtrada, { completo: true }))} testid="btn-pdf-completo"><Download size={15} /> {t("sermao.pdfCompleto", "PDF com todos completos")}</Botao>
        </>}
      </div>
      {aviso && <p className="text-sm mb-3" style={{ color: C.red }} data-testid="sermoes-aviso">{aviso}</p>}
      {erroCarga && <div className="rounded-lg p-3 mb-3 text-sm" style={{ background: "#FDECEA", color: C.red }} data-testid="sermoes-erro">{erroCarga} <button onClick={carregar} className="underline font-semibold">{t("tentarDeNovo", "Tentar de novo")}</button></div>}
      {!lista && !erroCarga && <p className="text-sm" style={{ color: C.stone }}><Loader2 size={15} className="inline animate-spin mr-1" />{t("carregando", "Carregando…")}</p>}
      {lista && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-[180px] rounded-md border px-3 bg-white" style={{ borderColor: C.line }}><Search size={15} color={C.stone} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t("sermao.buscar", "Buscar nos sermões")} aria-label={t("sermao.buscar", "Buscar nos sermões")} data-testid="sermoes-busca" className="flex-1 py-2 text-sm bg-transparent focus:outline-none" /></div>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label={t("sermao.tipo", "Tipo de mensagem")} data-testid="sermoes-filtro" className="rounded-md border px-3 py-2 text-sm bg-white" style={{ borderColor: C.line }}><option value="">{t("sermao.todosTipos", "Todos os tipos")}</option>{TIPOS.map(([id]) => <option key={id} value={id}>{nomeTipo(id)}</option>)}</select>
          </div>
          {lista.length === 0 && <p className="text-sm italic" style={{ color: C.stone }} data-testid="sermoes-vazio">{t("sermao.nenhum", "Nenhum sermão ainda. Comece pelo botão acima.")}</p>}
          {lista.length > 0 && filtrada.length === 0 && <p className="text-sm italic" style={{ color: C.stone }}>{t("sermao.nadaEncontrado", "Nenhum sermão encontrado com esse filtro.")}</p>}
          <div className="space-y-3">
            {filtrada.map((s) => (
              <div key={s.id} className="rounded-xl border p-4 bg-white" style={{ borderColor: C.gold + "55" }} data-testid="cartao-sermao">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-lg leading-snug" style={{ color: C.ink }}>{s.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.goldDeep }}>{[nomeTipo(s.tipo), dataBR(s.data), s.textoBase].filter(Boolean).join("  ·  ")}{s.origem === "ia" ? "  ·  IA" : ""}</p>
                  </div>
                </div>
                {s.tema && <p className="text-sm mt-1.5" style={{ color: C.ink }}>{s.tema}</p>}
                {(s.pontos || []).length > 0 && <p className="text-xs mt-1.5" style={{ color: C.stone }}>{t("sermao.pontosLista", "Pontos")}: {s.pontos.map((p) => p.titulo).filter(Boolean).join(" · ")}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Botao pequeno tom="escuro" onClick={() => { setEdit(s); setTela("editor"); }} testid="btn-abrir-sermao"><Pencil size={13} /> {t("abrirEditar", "Abrir / editar")}</Botao>
                  <Botao pequeno tom="claro" onClick={() => baixarPDF(nomeArq(s), pdfSermao(s))} testid="btn-pdf-sermao"><Download size={13} /> PDF</Botao>
                  <Botao pequeno tom="claro" onClick={() => duplicar(s)} testid="btn-duplicar-sermao"><Copy size={13} /> {t("duplicar", "Duplicar")}</Botao>
                  <Botao pequeno tom="perigo" onClick={() => apagar(s)} testid="btn-apagar-sermao"><Trash2 size={13} /> {t("apagar", "Apagar")}</Botao>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
