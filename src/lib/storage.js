// Adaptador de armazenamento.
//
// - Dentro do Claude (artefato), usa window.storage — dados reais, compartilhados
//   entre quem abrir o artefato.
// - Publicado como site estático (Vercel/Netlify/GitHub Pages), NÃO existe
//   window.storage, então cai para localStorage do navegador.
//
// ATENÇÃO — limitação importante do modo localStorage:
// os dados ficam presos ao navegador de quem está usando o site. Um cadastro feito
// pelo admin em um computador não aparece para um visitante em outro celular, e os
// dados somem se o histórico/cache do navegador for limpo. Isso é suficiente para
// testar conteúdo e visual sozinho, mas NÃO é um banco de dados real compartilhado
// entre todos os visitantes do site.
//
// Para dados de verdade compartilhados (o objetivo final do projeto), troque as
// duas funções abaixo por chamadas a um backend real — por exemplo Supabase ou
// Firebase, que têm plano gratuito e funcionam direto do navegador sem precisar
// manter um servidor rodando.

const hasNativeStorage = typeof window !== "undefined" && !!window.storage;

function localGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { key, value: raw, shared: false } : null;
  } catch (e) {
    return null;
  }
}

function localSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return { key, value, shared: false };
  } catch (e) {
    return null;
  }
}

export async function storageGet(key) {
  if (hasNativeStorage) {
    try {
      return await window.storage.get(key, true);
    } catch (e) {
      return null;
    }
  }
  return localGet(key);
}

export async function storageSet(key, value) {
  if (hasNativeStorage) {
    try {
      return await window.storage.set(key, value, true);
    } catch (e) {
      console.error("Falha ao salvar", key, e);
      return null;
    }
  }
  return localSet(key, value);
}
