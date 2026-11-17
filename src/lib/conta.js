// Cliente das contas de usuário e do acesso aos sermões. Fala com o servidor do Ministério (/api/conta):
// senha e código são conferidos LÁ; este arquivo só guarda a sessão no aparelho.
//   - "Manter conectado": a sessão (token) fica no aparelho (localStorage) e o servidor a revoga se o acesso for bloqueado.
//   - Sem marcar: a sessão vale só enquanto a aba estiver aberta (sessionStorage).
import { useEffect, useState } from "react";
import { tokenAdmin } from "./storage.js";

const API = "https://avivardoespirito.com.br/api/conta";
const K_USU = "biblia:conta-sessao";
const K_SRM = "biblia:sermoes-acesso";
const K_DEV = "biblia:aparelho";

const estado = { usuario: null, sermonista: null, perfil: null, pronto: false };
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => { try { f(); } catch (e) { /* ok */ } });

function guardar(chave, obj, lembrar) {
  try { localStorage.removeItem(chave); sessionStorage.removeItem(chave); } catch (e) { /* ok */ }
  if (!obj) return;
  try { (lembrar ? localStorage : sessionStorage).setItem(chave, JSON.stringify({ ...obj, lembrar: !!lembrar })); } catch (e) { /* ok */ }
}
function ler(chave) {
  for (const arm of [() => localStorage, () => sessionStorage]) {
    try {
      const v = JSON.parse(arm().getItem(chave) || "null");
      if (v && v.token && (!v.e || v.e > Date.now())) return v;
    } catch (e) { /* ok */ }
  }
  return null;
}
export function aparelhoId() {
  try {
    let d = localStorage.getItem(K_DEV);
    if (!d) { d = "d" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem(K_DEV, d); }
    return d;
  } catch (e) { return "d" + Math.random().toString(36).slice(2, 12); }
}

// Carrega a sessão guardada (chamar uma vez ao abrir o app).
export function iniciarConta() {
  estado.usuario = ler(K_USU);
  estado.sermonista = ler(K_SRM);
  estado.perfil = estado.usuario && estado.usuario.perfil ? estado.usuario.perfil : null;
  estado.pronto = true;
  avisar();
  if (estado.usuario) atualizarPerfil();
}
export const tokenSermonista = () => (estado.sermonista ? estado.sermonista.token : null);
export const tokenUsuario = () => (estado.usuario ? estado.usuario.token : null);

export function useConta() {
  const [, forca] = useState(0);
  useEffect(() => { const f = () => forca((n) => n + 1); ouvintes.add(f); return () => ouvintes.delete(f); }, []);
  return {
    logado: !!estado.usuario, perfil: estado.perfil, pronto: estado.pronto,
    temAcessoSermoes: !!estado.sermonista,
    lembrado: !!(estado.usuario && estado.usuario.lembrar),
  };
}

async function chamar(corpo, token) {
  try {
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(corpo) });
    const j = await res.json().catch(() => ({}));
    if (j && j.ok) return { ...j, ok: true };
    return { ok: false, status: res.status, motivo: (j && j.motivo) || (res.status === 429 ? "muitas_tentativas" : "falha") };
  } catch (e) { return { ok: false, motivo: "sem_conexao" }; }
}
export const MOTIVOS = {
  sem_conexao: "Sem conexão com o servidor. Confira a internet e tente de novo.",
  muitas_tentativas: "Muitas tentativas. Aguarde alguns minutos.",
  email_ja_cadastrado: "Este e-mail já tem cadastro. Use “Entrar”.",
  email_ou_senha: "E-mail ou senha incorretos.",
  nome_invalido: "Escreva seu nome.",
  email_invalido: "Esse e-mail não parece certo.",
  whatsapp_invalido: "Escreva o WhatsApp com DDD, por exemplo (85) 99999-0000.",
  senha_curta: "A senha precisa ter pelo menos 6 caracteres.",
  senha_incorreta: "A senha atual está incorreta.",
  codigo_incorreto: "Código incorreto. Confira e tente de novo.",
  nao_liberado: "Seu acesso ainda não foi liberado.",
  bloqueado: "Este acesso foi bloqueado pelo administrador.",
  expirado: "O prazo do seu acesso terminou. Peça a renovação ao administrador.",
  servidor_nao_configurado: "O servidor ainda não está configurado. Avise o administrador.",
  falha_no_banco: "O servidor está indisponível agora. Tente em instantes.",
  falha: "Não deu certo agora. Tente de novo.",
};
export const textoMotivo = (m) => MOTIVOS[m] || MOTIVOS.falha;

function aceitar(r, lembrar) {
  estado.usuario = { token: r.token, e: r.e, perfil: r.perfil };
  estado.perfil = r.perfil;
  guardar(K_USU, estado.usuario, lembrar);
  avisar();
}
export async function cadastrar({ nome, email, whatsapp, senha, lembrar }) {
  const r = await chamar({ acao: "cadastrar", nome, email, whatsapp, senha, lembrar: !!lembrar, dispositivo: aparelhoId() });
  if (r.ok) aceitar(r, lembrar);
  return r;
}
export async function entrar({ email, senha, lembrar }) {
  const r = await chamar({ acao: "entrar", email, senha, lembrar: !!lembrar, dispositivo: aparelhoId() });
  if (r.ok) aceitar(r, lembrar);
  return r;
}
export function sair() {
  estado.usuario = null; estado.sermonista = null; estado.perfil = null;
  guardar(K_USU, null); guardar(K_SRM, null);
  avisar();
}
export async function atualizarPerfil() {
  if (!estado.usuario) return null;
  const r = await chamar({ acao: "eu" }, estado.usuario.token);
  if (r.ok) {
    estado.perfil = r.perfil;
    estado.usuario = { ...estado.usuario, perfil: r.perfil };
    guardar(K_USU, estado.usuario, estado.usuario.lembrar);
    avisar();
    // se o acesso aos sermões foi bloqueado/expirou, o código guardado deixa de valer
    if (estado.sermonista && r.perfil.sermoes.estado !== "liberado") { estado.sermonista = null; guardar(K_SRM, null); avisar(); }
  } else if (r.status === 401) { sair(); }
  return r.ok ? r.perfil : null;
}
export async function trocarSenha(atual, nova) {
  if (!estado.usuario) return { ok: false, motivo: "falha" };
  return chamar({ acao: "trocarsenha", atual, nova }, estado.usuario.token);
}
export async function solicitarSermoes(mensagem) {
  if (!estado.usuario) return { ok: false, motivo: "falha" };
  const r = await chamar({ acao: "solicitarsermoes", mensagem }, estado.usuario.token);
  if (r.ok) { estado.perfil = r.perfil; estado.usuario = { ...estado.usuario, perfil: r.perfil }; guardar(K_USU, estado.usuario, estado.usuario.lembrar); avisar(); }
  return r;
}
export async function entrarSermoes(codigo, lembrar) {
  if (!estado.usuario) return { ok: false, motivo: "falha" };
  const r = await chamar({ acao: "sermaologin", codigo, lembrar: !!lembrar, dispositivo: aparelhoId() }, estado.usuario.token);
  if (r.ok) {
    estado.sermonista = { token: r.token, e: r.e };
    guardar(K_SRM, estado.sermonista, lembrar);
    estado.perfil = r.perfil; avisar();
  }
  return r;
}
export function sairSermoes() { estado.sermonista = null; guardar(K_SRM, null); avisar(); }

// Sermões do próprio usuário (guardados no servidor, só ele lê)
export async function sermoesDoUsuarioGet() {
  const t = tokenSermonista();
  if (!t) return { ok: false, motivo: "sem_sessao" };
  const r = await chamar({ acao: "sermaoget" }, t);
  if (!r.ok && r.status === 403) sairSermoes();
  return r.ok ? { ok: true, value: r.value } : { ok: false, motivo: r.motivo };
}
export async function sermoesDoUsuarioSet(value) {
  const t = tokenSermonista();
  if (!t) return { ok: false, motivo: "sem_sessao" };
  const r = await chamar({ acao: "sermaoset", value }, t);
  return r.ok ? { ok: true } : { ok: false, motivo: r.motivo };
}

/* ---------------- administrador (usa a sessão de administrador do storage.js) ---------------- */
const comAdmin = (corpo) => { const t = tokenAdmin(); return t ? chamar(corpo, t) : Promise.resolve({ ok: false, motivo: "sem_sessao" }); };
export const admListar = () => comAdmin({ acao: "admlistar" });
export const admLiberar = (id, dias, plano) => comAdmin({ acao: "admliberar", id, dias: dias || 0, plano });
export const admAjustar = (id, campos) => comAdmin({ acao: "admajustar", id, ...campos });
export const admBloquear = (id) => comAdmin({ acao: "admbloquear", id });
export const admNegar = (id) => comAdmin({ acao: "admnegar", id });
export const admSenhaTemp = (id) => comAdmin({ acao: "admsenhatemp", id });
export const admExcluir = (id) => comAdmin({ acao: "admexcluir", id });

// Link do WhatsApp com a mensagem pronta (abre a conversa com a pessoa)
export function linkZap(numero, texto) {
  const d = String(numero || "").replace(/\D/g, "");
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}
