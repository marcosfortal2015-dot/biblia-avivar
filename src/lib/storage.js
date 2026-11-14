// Adaptador de armazenamento — conecta direto no Supabase via REST API
// (PostgREST), reaproveitando o MESMO projeto/banco do site principal
// (Ministério Avivar do Espírito), na mesma tabela genérica site_data
// (key/value jsonb). As chaves usadas aqui começam com "biblia:" pra não
// colidir com as chaves do site principal.
//
// Isto substitui a versão anterior, que só usava localStorage do navegador
// e por isso nunca chegava a compartilhar dados de verdade entre visitantes
// (cada admin só via as próprias edições, no próprio navegador).

const SUPABASE_URL = "https://xnxfzygofnztpumqxqzt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TKv2SXrc_3ovC1hGPMdCow_lGP578sv";

const REST_URL = `${SUPABASE_URL}/rest/v1/site_data`;

// Gravar conteúdo da Bíblia exige ser administrador: a senha é conferida no SERVIDOR do site do
// Ministério (api/privado.js), que guarda a chave secreta do banco. Esta página só recebe uma
// sessão curta, guardada na memória (recarregar a página = entrar de novo).
const API_PRIVADO = "https://avivardoespirito.com.br/api/privado";
let sessao = null;
export function privateLogout() { sessao = null; }
export async function privateLogin(codigo) {
  try {
    const res = await fetch(API_PRIVADO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "login", codigo: String(codigo || "") }),
    });
    const r = await res.json().catch(() => ({}));
    if (res.ok && r && r.ok && r.token && r.papel === "admin") {
      sessao = { token: r.token };
      return { ok: true };
    }
    return { ok: false, motivo: res.ok && r && r.ok ? "invalido" : (r && r.motivo) || "invalido" };
  } catch (e) {
    return { ok: false, motivo: "sem_conexao" };
  }
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function storageGet(key) {
  try {
    const url = `${REST_URL}?key=eq.${encodeURIComponent(key)}&select=value`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows.length) return null;
    return { key, value: rows[0].value, shared: true };
  } catch (e) {
    console.error("Falha ao ler", key, e);
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    if (!sessao) return null; // sem login de administrador, nada é gravado
    const res = await fetch(API_PRIVADO, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessao.token}` },
      body: JSON.stringify({ acao: "setpub", key, value }),
    });
    if (res.status === 401) sessao = null; // sessão expirou
    if (!res.ok) {
      console.error("Falha ao salvar", key, res.status);
      return null;
    }
    return { key, value, shared: true };
  } catch (e) {
    console.error("Falha ao salvar", key, e);
    return null;
  }
}

// (versão antiga, gravava direto no banco com a chave pública — desativada)
async function _storageSetDireto(key, value) {
  try {
    const url = `${REST_URL}?on_conflict=key`;
    const res = await fetch(url, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }]),
    });
    if (!res.ok) {
      console.error("Falha ao salvar", key, await res.text());
      return null;
    }
    return { key, value, shared: true };
  } catch (e) {
    console.error("Falha ao salvar", key, e);
    return null;
  }
}
