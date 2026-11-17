/* Contas de usuário e acesso à área de preparação de sermões.
   - TelaConta: cadastro (nome, e-mail, WhatsApp, senha) e entrada; "manter conectado neste aparelho".
   - PaginaConta: dados da pessoa, situação do acesso aos sermões, trocar senha, sair.
   - AcessoSermoes: pedir a senha de acesso ao administrador, digitar o código recebido e (se quiser) manter liberado.
   - PainelAcessos (administrador): pedidos, gerar código, enviar por WhatsApp, bloquear, validade/plano, senha temporária.
   - PortaoCadastro: tela cheia quando o administrador exige cadastro para usar o app. */
import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, User, LogOut, ShieldCheck, Lock, MessageCircle, Copy, Check, Key, Users, RefreshCw, Trash2, Loader2, FileText } from "lucide-react";
import * as CT from "./lib/conta.js";

const OURO = "#E9C765";
const OURO2 = "#CBA135";
const LILAS = "#C9C2D8";
const serifa = "'Playfair Display', Georgia, serif";
const campo = { width: "100%", borderRadius: 10, border: "1px solid #CBA13588", padding: "11px 12px", fontSize: 15, background: "#fffdf8", color: "#1F1B2E", outline: "none" };
const cartao = { background: "linear-gradient(180deg,#2c1770 0%,#170b3a 100%)", border: "1.5px solid #CBA13599", borderRadius: 18, padding: "22px 20px", color: "#fff", boxShadow: "0 12px 40px #000a" };
const botaoOuro = { minHeight: 46, padding: "0 18px", borderRadius: 12, border: 0, background: "linear-gradient(180deg,#f6d77d,#c99530)", color: "#1a0d42", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 };
const botaoFantasma = { minHeight: 40, padding: "0 14px", borderRadius: 12, border: "1px solid #CBA13588", background: "transparent", color: OURO, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 };

const Rotulo = ({ children }) => <span style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: LILAS, margin: "12px 0 5px" }}>{children}</span>;
const Aviso = ({ tipo = "erro", children, ...r }) => children ? <p role={tipo === "erro" ? "alert" : "status"} style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.4, color: tipo === "erro" ? "#ffb4a8" : "#a9e6bf" }} {...r}>{children}</p> : null;
function Caixa({ marcado, aoMudar, children, testid }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "14px 0 2px", cursor: "pointer", fontSize: 13.5, lineHeight: 1.35, color: "#fff" }}>
      <input type="checkbox" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} data-testid={testid} style={{ width: 20, height: 20, marginTop: 1, accentColor: OURO2, flexShrink: 0 }} />
      <span>{children}</span>
    </label>
  );
}
const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";
const dataBR = (iso) => { try { return iso ? new Date(iso).toLocaleDateString("pt-BR") : ""; } catch (e) { return ""; } };
const maskZap = (v) => { const d = String(v || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11); if (d.length <= 2) return d; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
const zapBonito = (n) => maskZap(String(n || ""));

/* ------------------------------------------------------------------ */
export function TelaConta({ aoConcluir, inicial = "entrar", aviso }) {
  const [modo, setModo] = useState(inicial);
  const [f, setF] = useState({ nome: "", email: "", whatsapp: "", senha: "" });
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: k === "whatsapp" ? maskZap(e.target.value) : e.target.value }));
  const enviar = async (ev) => {
    if (ev) ev.preventDefault();
    if (ocupado) return;
    setErro(""); setOcupado(true);
    const r = modo === "criar" ? await CT.cadastrar({ ...f, lembrar }) : await CT.entrar({ email: f.email, senha: f.senha, lembrar });
    setOcupado(false);
    if (r.ok) { if (aoConcluir) aoConcluir(r); } else setErro(CT.textoMotivo(r.motivo));
  };
  return (
    <form onSubmit={enviar} style={cartao} data-testid="tela-conta" noValidate>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        {[["entrar", "Entrar"], ["criar", "Criar conta"]].map(([k, r]) => (
          <button type="button" key={k} onClick={() => { setModo(k); setErro(""); }} data-testid={"conta-aba-" + k} aria-pressed={modo === k}
            style={{ flex: 1, minHeight: 42, borderRadius: 999, border: "1px solid #CBA13599", fontWeight: 800, fontSize: 14, cursor: "pointer", background: modo === k ? "linear-gradient(180deg,#f6d77d,#c99530)" : "transparent", color: modo === k ? "#1a0d42" : OURO }}>{r}</button>
        ))}
      </div>
      {aviso && <p style={{ fontSize: 13.5, color: LILAS, lineHeight: 1.4, margin: "10px 0 0" }}>{aviso}</p>}
      {modo === "criar" && (<>
        <Rotulo>Seu nome</Rotulo>
        <input value={f.nome} onChange={set("nome")} autoComplete="name" data-testid="conta-nome" style={campo} placeholder="Nome e sobrenome" />
      </>)}
      <Rotulo>E-mail</Rotulo>
      <input type="email" inputMode="email" value={f.email} onChange={set("email")} autoComplete="email" data-testid="conta-email" style={campo} placeholder="voce@exemplo.com" />
      {modo === "criar" && (<>
        <Rotulo>WhatsApp (com DDD)</Rotulo>
        <input type="tel" inputMode="tel" value={f.whatsapp} onChange={set("whatsapp")} autoComplete="tel" data-testid="conta-whatsapp" style={campo} placeholder="(85) 99999-0000" />
      </>)}
      <Rotulo>{modo === "criar" ? "Crie uma senha (mínimo 6 caracteres)" : "Senha"}</Rotulo>
      <input type="password" value={f.senha} onChange={set("senha")} autoComplete={modo === "criar" ? "new-password" : "current-password"} data-testid="conta-senha" style={campo} />
      <Caixa marcado={lembrar} aoMudar={setLembrar} testid="conta-lembrar">Manter conectado neste aparelho (não pedir a senha de novo)</Caixa>
      <Aviso data-testid="conta-erro">{erro}</Aviso>
      <button type="submit" disabled={ocupado} data-testid="conta-enviar" style={{ ...botaoOuro, width: "100%", marginTop: 16, opacity: ocupado ? 0.7 : 1 }}>
        {ocupado ? <><Loader2 size={16} className="animate-spin" /> Aguarde…</> : modo === "criar" ? "Criar minha conta" : "Entrar"}
      </button>
      {modo === "entrar" && <p style={{ fontSize: 12.5, color: LILAS, marginTop: 12, lineHeight: 1.4 }}>Esqueceu a senha? Peça uma senha temporária ao administrador pelo WhatsApp.</p>}
      {modo === "criar" && <p style={{ fontSize: 12.5, color: LILAS, marginTop: 12, lineHeight: 1.4 }}>Seus dados ficam guardados com segurança e só o administrador do ministério os vê. A senha nunca é mostrada a ninguém.</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
const Casca = ({ onBack, titulo, icone: Ic, children, largura = 480 }) => (
  <div style={{ maxWidth: largura, margin: "0 auto", padding: "18px 14px 30px" }}>
    {onBack && <button onClick={onBack} data-testid="conta-voltar" style={{ ...botaoFantasma, border: 0, padding: 0, minHeight: 36, marginBottom: 10 }}><ArrowLeft size={17} /> Voltar</button>}
    {titulo && <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px", color: OURO }}>{Ic && <Ic size={24} />}<h1 style={{ margin: 0, fontFamily: serifa, fontSize: 26, color: "#F3E6B8" }}>{titulo}</h1></div>}
    {children}
  </div>
);

export function PaginaConta({ onBack, onSermoes, whatsappAdmin }) {
  const c = CT.useConta();
  const [aberta, setAberta] = useState(false);
  const [f, setF] = useState({ atual: "", nova: "" });
  const [msg, setMsg] = useState({ t: "", tipo: "ok" });
  useEffect(() => { if (c.logado) CT.atualizarPerfil(); }, [c.logado]);
  if (!c.logado) return <Casca onBack={onBack} titulo="Minha conta" icone={User}><TelaConta aviso="Crie sua conta para usar o app com seu cadastro, ou entre se já tem uma." aoConcluir={() => {}} /></Casca>;
  const p = c.perfil || {};
  const st = (p.sermoes && p.sermoes.estado) || "nenhum";
  const rotuloSt = { nenhum: "Não solicitado", solicitado: "Pedido enviado, aguardando o administrador", liberado: "Liberado", bloqueado: "Bloqueado", expirado: "Prazo terminado" }[st] || st;
  const trocar = async () => {
    const r = await CT.trocarSenha(f.atual, f.nova);
    if (r.ok) { setMsg({ t: "Senha trocada.", tipo: "ok" }); setF({ atual: "", nova: "" }); setAberta(false); } else setMsg({ t: CT.textoMotivo(r.motivo), tipo: "erro" });
  };
  return (
    <Casca onBack={onBack} titulo="Minha conta" icone={User}>
      <div style={cartao} data-testid="pagina-conta">
        <p style={{ margin: 0, fontFamily: serifa, fontSize: 22, color: "#F3E6B8" }} data-testid="conta-nome-exibido">{p.nome}</p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: LILAS }}>{p.email}</p>
        <p style={{ margin: "2px 0 0", fontSize: 14, color: LILAS }}>WhatsApp {zapBonito(p.whatsapp)}</p>
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#ffffff12", border: "1px solid #CBA13555" }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.1em", color: OURO2, fontFamily: "monospace" }}>PREPARAÇÃO DE SERMÕES</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700 }} data-testid="conta-estado-sermoes">{rotuloSt}{st === "liberado" && p.sermoes.ate ? ` · até ${dataBR(p.sermoes.ate)}` : ""}</p>
          <button onClick={onSermoes} style={{ ...botaoFantasma, marginTop: 10 }} data-testid="conta-ir-sermoes"><FileText size={16} /> Abrir área de sermões</button>
          {c.temAcessoSermoes && <button onClick={() => CT.sairSermoes()} style={{ ...botaoFantasma, marginTop: 10, marginLeft: 8 }} data-testid="conta-sair-sermoes"><Lock size={16} /> Bloquear sermões neste aparelho</button>}
        </div>
        {aberta ? (
          <div style={{ marginTop: 16 }}>
            <Rotulo>Senha atual</Rotulo><input type="password" value={f.atual} onChange={(e) => setF({ ...f, atual: e.target.value })} style={campo} autoComplete="current-password" />
            <Rotulo>Nova senha</Rotulo><input type="password" value={f.nova} onChange={(e) => setF({ ...f, nova: e.target.value })} style={campo} autoComplete="new-password" />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button onClick={trocar} style={botaoOuro}>Trocar senha</button><button onClick={() => setAberta(false)} style={botaoFantasma}>Cancelar</button></div>
          </div>
        ) : <button onClick={() => { setAberta(true); setMsg({ t: "" }); }} style={{ ...botaoFantasma, marginTop: 14 }}><Key size={16} /> Trocar minha senha</button>}
        <Aviso tipo={msg.tipo}>{msg.t}</Aviso>
        <button onClick={() => { CT.sair(); }} data-testid="conta-sair" style={{ ...botaoFantasma, marginTop: 18, borderColor: "#ffb4a8aa", color: "#ffb4a8" }}><LogOut size={16} /> Sair da minha conta</button>
        <p style={{ fontSize: 12.5, color: LILAS, marginTop: 14 }}>{c.lembrado ? "Este aparelho está conectado: você não precisa digitar a senha de novo." : "Você está conectado só enquanto este navegador estiver aberto."}</p>
      </div>
    </Casca>
  );
}

/* ------------------------------------------------------------------ */
// Porta da área de sermões. Se a pessoa já tem o código aceito, mostra o conteúdo (children).
export function AcessoSermoes({ onBack, whatsappAdmin, children }) {
  const c = CT.useConta();
  const [cod, setCod] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msgPedido, setMsgPedido] = useState("");
  useEffect(() => { if (c.logado) CT.atualizarPerfil(); }, [c.logado]);
  if (c.temAcessoSermoes) return children;
  if (!c.logado) {
    return <Casca onBack={onBack} titulo="Sermões" icone={FileText}><TelaConta aviso="Para pedir o acesso à área de preparação de sermões, primeiro entre ou crie sua conta." /></Casca>;
  }
  const p = c.perfil || {};
  const st = (p.sermoes && p.sermoes.estado) || "nenhum";
  const pedir = async () => {
    setErro(""); setOcupado(true);
    const r = await CT.solicitarSermoes(msgPedido);
    setOcupado(false);
    if (!r.ok) setErro(CT.textoMotivo(r.motivo));
  };
  const entrar = async (ev) => {
    if (ev) ev.preventDefault();
    if (ocupado || !cod.trim()) return;
    setErro(""); setOcupado(true);
    const r = await CT.entrarSermoes(cod, lembrar);
    setOcupado(false);
    if (!r.ok) setErro(CT.textoMotivo(r.motivo));
  };
  const textoAviso = `Paz do Senhor! Sou ${p.nome} (${p.email}). Solicito a senha de acesso à área de preparação de sermões da Bíblia Avivar.`;
  return (
    <Casca onBack={onBack} titulo="Preparação de sermões" icone={FileText}>
      <div style={cartao} data-testid="acesso-sermoes">
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: LILAS }}>Esta área é reservada. O administrador gera uma senha de acesso para você e envia pelo seu WhatsApp.</p>
        {(st === "nenhum" || st === "bloqueado" || st === "expirado") && (
          <div style={{ marginTop: 16 }}>
            {st === "bloqueado" && <Aviso>Seu acesso foi bloqueado pelo administrador.</Aviso>}
            {st === "expirado" && <Aviso>O prazo do seu acesso terminou. Peça a renovação.</Aviso>}
            {st !== "bloqueado" && (<>
              <Rotulo>Recado para o administrador (opcional)</Rotulo>
              <input value={msgPedido} onChange={(e) => setMsgPedido(e.target.value)} style={campo} placeholder="Ex.: sou pregador na igreja…" maxLength={200} data-testid="pedido-mensagem" />
              <button onClick={pedir} disabled={ocupado} data-testid="solicitar-senha" style={{ ...botaoOuro, width: "100%", marginTop: 14, opacity: ocupado ? 0.7 : 1 }}>{ocupado ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Solicitar senha de acesso</button>
            </>)}
          </div>
        )}
        {st === "solicitado" && (
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#ffffff12", border: "1px solid #CBA13555" }} data-testid="pedido-enviado">
            <p style={{ margin: 0, fontWeight: 800, color: OURO }}>Pedido enviado!</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45 }}>O administrador vai gerar sua senha e enviar pelo WhatsApp {zapBonito(p.whatsapp)}. Quando chegar, digite abaixo.</p>
            {whatsappAdmin && <a href={CT.linkZap(whatsappAdmin, textoAviso)} target="_blank" rel="noreferrer" style={{ ...botaoFantasma, marginTop: 10, textDecoration: "none" }} data-testid="avisar-admin"><MessageCircle size={16} /> Avisar o administrador pelo WhatsApp</a>}
          </div>
        )}
        {(st === "liberado" || st === "solicitado") && (
          <form onSubmit={entrar} style={{ marginTop: 18 }}>
            <Rotulo>Senha de acesso aos sermões</Rotulo>
            <input value={cod} onChange={(e) => setCod(e.target.value.toUpperCase())} style={{ ...campo, letterSpacing: "0.12em", fontWeight: 700 }} placeholder="SRM-XXX-XXX" autoCapitalize="characters" autoCorrect="off" spellCheck={false} data-testid="sermoes-codigo" />
            <Caixa marcado={lembrar} aoMudar={setLembrar} testid="sermoes-lembrar">Manter liberado neste aparelho (não pedir a senha de novo)</Caixa>
            <button type="submit" disabled={ocupado || !cod.trim()} data-testid="sermoes-entrar" style={{ ...botaoOuro, width: "100%", marginTop: 14, opacity: ocupado || !cod.trim() ? 0.6 : 1 }}><ShieldCheck size={16} /> Entrar na área de sermões</button>
          </form>
        )}
        <Aviso data-testid="sermoes-erro">{erro}</Aviso>
      </div>
    </Casca>
  );
}

/* ------------------------------------------------------------------ */
// Tela cheia quando o administrador exige cadastro para usar o app.
export function PortaoCadastro({ onAdmin }) {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, #2B1D4A 0%, #0B0B0C 70%)", color: "#FBF6ED", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 14px" }} data-testid="portao-cadastro">
      <img src="/logo-icone.png" alt="" style={{ height: 60, width: "auto" }} />
      <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.3em", color: OURO2, margin: "14px 0 0", textTransform: "uppercase" }}>Ministério Avivar do Espírito</p>
      <h1 style={{ fontFamily: serifa, fontSize: 30, margin: "6px 0 18px", color: "#F3E6B8" }}>Bíblia Avivar</h1>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <TelaConta aviso="Entre com a sua conta ou crie uma agora para usar o app completo." aoConcluir={() => {}} />
        <p style={{ textAlign: "center", marginTop: 16 }}><button onClick={onAdmin} data-testid="portao-admin" style={{ background: "none", border: 0, color: LILAS, fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>Sou administrador</button></p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Administração: pedidos, códigos, validade e usuários.
const ROTULO_ST = { nenhum: "Sem pedido", solicitado: "Pediu acesso", liberado: "Liberado", bloqueado: "Bloqueado", expirado: "Expirado" };
const COR_ST = { nenhum: "#8A8272", solicitado: "#f0a63a", liberado: "#3fae6a", bloqueado: "#d5604f", expirado: "#d5604f" };

export function PainelAcessos({ onBack, config, saveConfig, aoContar }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("pedidos");
  const [dias, setDias] = useState({});
  const [mostrar, setMostrar] = useState(null); // { id, tipo:"codigo"|"senha", valor }
  const [copiado, setCopiado] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [edit, setEdit] = useState(null);
  const [zapAdm, setZapAdm] = useState(config.whatsappAdmin || "");
  const carregar = useCallback(async () => {
    const r = await CT.admListar();
    if (r.ok) { setLista(r.contas); setErro(""); if (aoContar) aoContar(r.pendentes); } else setErro(r.motivo === "sem_sessao" ? "Sua sessão de administrador terminou. Entre de novo como administrador." : CT.textoMotivo(r.motivo));
  }, [aoContar]);
  useEffect(() => { carregar(); }, [carregar]);
  const acao = async (id, fn, chave) => {
    setOcupado(id + chave); setCopiado(false);
    const r = await fn();
    setOcupado("");
    if (!r.ok) { setErro(CT.textoMotivo(r.motivo)); return null; }
    setErro(""); await carregar(); return r;
  };
  const liberar = async (u) => { const r = await acao(u.id, () => CT.admLiberar(u.id, Number(dias[u.id]) || 0), "lib"); if (r) { setMostrar({ id: u.id, tipo: "codigo", valor: r.codigo }); setFiltro("liberados"); } };
  const senhaTemp = async (u) => { if (!window.confirm(`Gerar uma senha temporária para ${u.nome}? A senha atual dela deixa de valer.`)) return; const r = await acao(u.id, () => CT.admSenhaTemp(u.id), "tmp"); if (r) setMostrar({ id: u.id, tipo: "senha", valor: r.senha }); };
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); setCopiado(true); } catch (e) { /* ok */ } };
  const textoCodigo = (u, cod) => `Paz do Senhor, ${primeiroNome(u.nome)}! 🙏\n\nSeu acesso à *área de preparação de sermões* da Bíblia Avivar foi liberado.\n\nSua senha de acesso: *${cod}*\n\nComo entrar: abra o app (${typeof window !== "undefined" ? window.location.origin : ""}), toque no menu ☰ > Sermões, digite a senha e, se quiser, marque “Manter liberado neste aparelho”.\n\nQue Deus abençoe seu preparo!`;
  const textoSenha = (u, s) => `Paz do Senhor, ${primeiroNome(u.nome)}! Sua senha temporária na Bíblia Avivar é: *${s}*\n\nEntre com seu e-mail (${u.email}) e depois troque a senha em Menu > Minha conta.`;
  const mostradas = (lista || []).filter((u) => filtro === "todos" || (filtro === "pedidos" ? u.sermoes.estado === "solicitado" : filtro === "liberados" ? u.sermoes.estado === "liberado" : u.sermoes.estado === "bloqueado" || u.sermoes.estado === "expirado"));
  const pend = (lista || []).filter((u) => u.sermoes.estado === "solicitado").length;
  const Aba = ({ k, r }) => <button onClick={() => setFiltro(k)} data-testid={"acessos-aba-" + k} aria-pressed={filtro === k} style={{ minHeight: 38, padding: "0 14px", borderRadius: 999, border: "1px solid #CBA13599", fontWeight: 800, fontSize: 13, cursor: "pointer", background: filtro === k ? "linear-gradient(180deg,#f6d77d,#c99530)" : "transparent", color: filtro === k ? "#1a0d42" : OURO }}>{r}</button>;
  return (
    <Casca onBack={onBack} titulo="Acessos e usuários" icone={Users} largura={720}>
      <div style={{ ...cartao, marginBottom: 14 }} data-testid="acessos-config">
        <Caixa marcado={!!config.exigirCadastro} aoMudar={(v) => saveConfig({ ...config, exigirCadastro: v })} testid="cfg-exigir">Exigir cadastro (e-mail e senha) para usar o app</Caixa>
        <p style={{ margin: "4px 0 0 30px", fontSize: 12.5, color: LILAS, lineHeight: 1.4 }}>Desligado: qualquer pessoa lê a Bíblia sem conta (a conta é opcional). Ligado: o app só abre para quem entrar ou se cadastrar.</p>
        <Rotulo>Seu WhatsApp (para quem pede o acesso poder avisar você)</Rotulo>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={zapAdm} onChange={(e) => setZapAdm(maskZap(e.target.value))} style={campo} placeholder="(85) 99999-0000" data-testid="cfg-zap" />
          <button onClick={() => saveConfig({ ...config, whatsappAdmin: zapAdm.replace(/\D/g, "") ? "55" + zapAdm.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "") : "" })} style={botaoOuro} data-testid="cfg-zap-salvar">Salvar</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <Aba k="pedidos" r={`Pedidos${pend ? ` (${pend})` : ""}`} /><Aba k="liberados" r="Liberados" /><Aba k="bloqueados" r="Bloqueados" /><Aba k="todos" r="Todos" />
        <button onClick={carregar} aria-label="Atualizar lista" style={{ ...botaoFantasma, minHeight: 38 }}><RefreshCw size={15} /></button>
      </div>
      <Aviso data-testid="acessos-erro">{erro}</Aviso>
      {lista === null && !erro && <p style={{ color: LILAS }}><Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> Carregando…</p>}
      {lista && mostradas.length === 0 && <p style={{ color: LILAS, fontSize: 14 }}>Nenhuma pessoa nesta lista.</p>}
      {mostradas.map((u) => (
        <div key={u.id} style={{ ...cartao, padding: "16px 16px", marginBottom: 12 }} data-testid={"acesso-" + u.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 17, fontFamily: serifa, color: "#F3E6B8" }}>{u.nome}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13.5, color: LILAS, wordBreak: "break-all" }}>{u.email} · {zapBonito(u.whatsapp)}</p>
            </div>
            <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: COR_ST[u.sermoes.estado] + "33", color: "#fff", border: `1px solid ${COR_ST[u.sermoes.estado]}` }} data-testid="acesso-estado">{ROTULO_ST[u.sermoes.estado]}</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: LILAS }}>
            Cadastro {dataBR(u.criadoEm)}{u.ultimoAcesso ? ` · último acesso ${dataBR(u.ultimoAcesso)}` : ""}{u.sermoes.plano ? ` · plano: ${u.sermoes.plano}` : ""}{u.sermoes.ate ? ` · válido até ${dataBR(u.sermoes.ate)}` : u.sermoes.estado === "liberado" ? " · sem prazo" : ""}
          </p>
          {u.mensagem && <p style={{ margin: "6px 0 0", fontSize: 13.5, fontStyle: "italic" }}>“{u.mensagem}”</p>}
          {mostrar && mostrar.id === u.id && (
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "#0b0b0c80", border: "1.5px solid #CBA135" }} data-testid="codigo-gerado">
              <p style={{ margin: 0, fontSize: 12.5, color: LILAS }}>{mostrar.tipo === "codigo" ? "Código de acesso gerado (aparece só agora):" : "Senha temporária (aparece só agora):"}</p>
              <p style={{ margin: "4px 0 10px", fontSize: 26, fontWeight: 800, letterSpacing: "0.1em", color: OURO, fontFamily: "monospace" }} data-testid="codigo-valor">{mostrar.valor}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a href={CT.linkZap(u.whatsapp, mostrar.tipo === "codigo" ? textoCodigo(u, mostrar.valor) : textoSenha(u, mostrar.valor))} target="_blank" rel="noreferrer" style={{ ...botaoOuro, textDecoration: "none" }} data-testid="enviar-whatsapp"><MessageCircle size={17} /> Enviar pelo WhatsApp</a>
                <button onClick={() => copiar(mostrar.valor)} style={botaoFantasma}>{copiado ? <Check size={16} /> : <Copy size={16} />} {copiado ? "Copiado" : "Copiar"}</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
            {(u.sermoes.estado !== "liberado") && (
              <select value={dias[u.id] || "0"} onChange={(e) => setDias({ ...dias, [u.id]: e.target.value })} aria-label="Prazo do acesso" style={{ ...campo, width: "auto", minHeight: 42, padding: "0 10px" }} data-testid="acesso-dias">
                <option value="0">Sem prazo</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="365">1 ano</option>
              </select>
            )}
            <button onClick={() => liberar(u)} disabled={!!ocupado} data-testid="acesso-liberar" style={botaoOuro}>{ocupado === u.id + "lib" ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} {u.sermoes.estado === "liberado" ? "Gerar novo código" : u.sermoes.estado === "solicitado" ? "Gerar código e liberar" : "Liberar com código"}</button>
            {u.sermoes.estado === "liberado" && <button onClick={async () => { if (await acao(u.id, () => CT.admBloquear(u.id), "blq")) setFiltro("bloqueados"); }} style={botaoFantasma} data-testid="acesso-bloquear">Bloquear</button>}
            {u.sermoes.estado === "solicitado" && <button onClick={() => acao(u.id, () => CT.admNegar(u.id), "neg")} style={botaoFantasma}>Recusar</button>}
            <button onClick={() => setEdit(edit && edit.id === u.id ? null : { id: u.id, plano: u.sermoes.plano || "", ate: u.sermoes.ate ? u.sermoes.ate.slice(0, 10) : "", obs: u.obs || "" })} style={botaoFantasma}>Plano e validade</button>
            <button onClick={() => senhaTemp(u)} style={botaoFantasma}><Key size={15} /> Senha temporária</button>
            <button onClick={() => { if (window.confirm(`Excluir a conta de ${u.nome}? Os sermões dela também serão apagados.`)) acao(u.id, () => CT.admExcluir(u.id), "del"); }} aria-label="Excluir conta" style={{ ...botaoFantasma, color: "#ffb4a8", borderColor: "#ffb4a8aa" }}><Trash2 size={15} /></button>
          </div>
          {edit && edit.id === u.id && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <input value={edit.plano} onChange={(e) => setEdit({ ...edit, plano: e.target.value })} style={campo} placeholder="Plano (ex.: liberado, mensal, anual)" data-testid="edit-plano" />
              <input type="date" value={edit.ate} onChange={(e) => setEdit({ ...edit, ate: e.target.value })} style={campo} aria-label="Válido até" data-testid="edit-ate" />
              <input value={edit.obs} onChange={(e) => setEdit({ ...edit, obs: e.target.value })} style={campo} placeholder="Anotação do administrador (só você vê)" />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => { const r = await acao(u.id, () => CT.admAjustar(u.id, { plano: edit.plano, ate: edit.ate ? new Date(edit.ate + "T23:59:59").toISOString() : "", obs: edit.obs }), "adj"); if (r) setEdit(null); }} style={botaoOuro} data-testid="edit-salvar">Salvar</button>
                <button onClick={() => setEdit(null)} style={botaoFantasma}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <p style={{ fontSize: 12.5, color: LILAS, lineHeight: 1.5, marginTop: 18 }}>Planos: cada pessoa tem um “plano” e uma “validade”. Quando a validade passa, o acesso aos sermões se encerra sozinho. É a base para as assinaturas: depois basta ligar o pagamento a esses dois campos.</p>
    </Casca>
  );
}
