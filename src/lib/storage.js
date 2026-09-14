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
