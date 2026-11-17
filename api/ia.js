// Bíblia Avivar — assistente de IA (temas e sermões para pastores, interpretação de versículos, palavras difíceis).
//
// POST /api/ia  { acao, ... }   (corpo JSON)         Resposta: { ok:true, dados } ou { ok:false, motivo }
//   acao "status"      público  -> { ok, ligada }            (a tela usa para mostrar ou esconder os botões de IA)
//   acao "interpretar" público* -> { ref, versiculos:[{n,t}], traducao? }
//   acao "palavra"     público* -> { termo, ref?, trecho? }   (aprofundar uma palavra difícil)
//   acao "temas"       ADMIN*   -> { tipo, publico?, quantidade? }
//   acao "sermao"      ADMIN    -> { tema, textoBase?, passagens?, tipo?, duracaoMin?, publico?, estilo?, observacoes? }
//   acao "reescrever"  ADMIN    -> { secao, texto, instrucao }
//   (* limitado por aparelho/endereço para não gerar custo à toa)
// Administrador = quem entrou com a senha de administrador (Authorization: Bearer <token>, o mesmo de /api/privado).
// ADMIN* = também quem recebeu o código da área de sermões (token "sermonista" de /api/conta, conferido a cada pedido).
//
// DESLIGADA POR PADRÃO: sem a chave abaixo, responde { ok:false, motivo:"ia_desligada" } e o app mostra um aviso amigável.
// Variáveis de ambiente (Vercel > Settings > Environment Variables):
//   ANTHROPIC_API_KEY   chave da IA (a conta é sua; a chave NUNCA vai para o código nem para o navegador)
//   IA_MODELO           (opcional) padrão "claude-sonnet-5-5"
//   IA_LIMITE_PUBLICO   (opcional) pedidos públicos por endereço a cada hora (padrão 8)
//   IA_LIMITE_DIA       (opcional) teto de pedidos públicos por dia, somando todos (padrão 300)
//   TOKEN_SECRET        já existe (confere o login do administrador)
import { verificar, ORIGENS } from "./privado.js";
import { sermonistaAtivo } from "./conta.js";

const MODELO_PADRAO = "claude-sonnet-5-5";
const API_IA = "https://api.anthropic.com/v1/messages";
const HORA = 60 * 60 * 1000;
const janela = new Map(); // endereço -> instantes dos pedidos
const dia = { chave: "", n: 0 };
export const _estado = { janela, dia };

function resposta(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}
function cors(req, res) {
  const o = String((req.headers && req.headers.origin) || "");
  if (o && ORIGENS.includes(o)) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "600");
  }
}
function estourou(ip, max, agora) {
  const l = (janela.get(ip) || []).filter((t) => agora - t < HORA);
  l.push(agora); janela.set(ip, l);
  if (janela.size > 5000) for (const [k, v] of janela) if (!v.some((t) => agora - t < HORA)) janela.delete(k);
  return l.length > max;
}
function tetoDoDia(max, agora) {
  const hoje = new Date(agora).toISOString().slice(0, 10);
  if (dia.chave !== hoje) { dia.chave = hoje; dia.n = 0; }
  dia.n += 1;
  return dia.n > max;
}

/* ------------------------------ texto e JSON ------------------------------ */
const txt = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/\u0000/g, "").trim().slice(0, max);
const lista = (v, max, maxItem) => (Array.isArray(v) ? v : []).map((x) => txt(x, maxItem)).filter(Boolean).slice(0, max);
// Quando a resposta é cortada no meio (limite de tamanho), aproveita o que veio completo:
// volta até o último "}" ou "]" fechado e fecha, na ordem certa, o que ficou aberto.
export function repararJSON(s) {
  const pilha = []; let dentro = false, esc = false, seguro = -1, pilhaSegura = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (dentro) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') dentro = false; continue; }
    if (ch === '"') dentro = true;
    else if (ch === "{" || ch === "[") pilha.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") { pilha.pop(); seguro = i + 1; pilhaSegura = pilha.slice(); }
  }
  if (seguro < 0) return null;
  try { return JSON.parse(s.slice(0, seguro) + pilhaSegura.reverse().join("")); } catch (e) { return null; }
}
export function extrairJSON(texto) {
  const s = String(texto || "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0) return null;
  if (b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { /* tenta reparar abaixo */ } }
  return repararJSON(s.slice(a));
}

const SISTEMA = `Você é um assistente de estudo bíblico e de preparação de mensagens do Ministério Avivar do Espírito, uma igreja evangélica pentecostal brasileira. Escreva sempre em português do Brasil, com linguagem simples, calorosa e respeitosa.
Regras:
- Baseie tudo no texto bíblico. Cite referências no formato "João 3:16" e só cite versículos que existem de verdade; se não tiver certeza de uma referência, não a cite.
- Não invente citações de pessoas, estatísticas, nem fatos históricos. Quando algo for discutido entre as tradições cristãs, diga isso com humildade, sem desprezar quem pensa diferente.
- Ao falar de cura, libertação, prosperidade ou promessas, não prometa resultados garantidos e nunca oriente ninguém a abandonar tratamento médico ou psicológico.
- Nada de política partidária, ataque a pessoas ou a outras igrejas.
- Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, exatamente no formato pedido.`;

const FORMATOS = {
  interpretar: `{"contexto":"onde e quando o trecho foi escrito e para quem (2 a 4 frases)","significado":"o que o trecho quer dizer, versículo a versículo quando fizer sentido","aplicacao":"como aplicar hoje, de forma prática","referencias":["outras passagens que ajudam, com referência"],"observacao":"aviso se houver mais de uma interpretação entre os cristãos, ou vazio"}`,
  palavra: `{"resumo":"explicação curta e clara","origem":"origem da palavra e língua original","contexto":"contexto histórico e cultural","usoBiblico":"como a Bíblia usa a palavra (com referências)","curiosidades":["2 a 4 curiosidades verdadeiras"]}`,
  temas: `{"temas":[{"titulo":"título curto e marcante","resumo":"em 1 ou 2 frases, qual a ideia central","textoBase":"referência principal","passagens":[{"ref":"referência de apoio","nota":"por que ajuda"}]}]}`,
  sermao: `{"titulo":"","tema":"","textoBase":"","introducao":"abertura que prende a atenção (um parágrafo)","pontos":[{"titulo":"ponto da mensagem","texto":"desenvolvimento do ponto (2 a 3 parágrafos)","versiculos":["referências de apoio"],"ilustracao":"ilustração ou exemplo simples e verdadeiro"}],"aplicacao":"aplicação prática para a semana","conclusao":"fechamento","apelo":"convite final (decisão, oração, ministração)","perguntas":["perguntas para refletir em grupo ou na célula"],"dicas":["dicas práticas de pregação: ritmo, tempo, uso de recursos, pontos que pedem atenção"]}`,
  reescrever: `{"texto":"o texto reescrito"}`,
};

function montar(acao, c) {
  if (acao === "interpretar") {
    const vs = (Array.isArray(c.versiculos) ? c.versiculos : []).slice(0, 40).map((v) => `${Number(v && v.n) || "?"}. ${txt(v && v.t, 700)}`).join("\n");
    if (!vs.trim()) return null;
    return `Interprete o trecho ${txt(c.ref, 80)} (${txt(c.traducao, 20) || "tradução em português"}), para um leitor comum da Bíblia.\n\nTexto:\n${vs.slice(0, 4000)}\n\nFormato da resposta:\n${FORMATOS.interpretar}`;
  }
  if (acao === "palavra") {
    const termo = txt(c.termo, 60); if (!termo) return null;
    return `Explique a palavra bíblica "${termo}"${c.ref ? ` como aparece em ${txt(c.ref, 80)}` : ""}.${c.trecho ? `\nTrecho: ${txt(c.trecho, 500)}` : ""}\n\nFormato da resposta:\n${FORMATOS.palavra}`;
  }
  if (acao === "temas") {
    const tipo = txt(c.tipo, 120); if (!tipo) return null;
    const q = Math.min(8, Math.max(3, Number(c.quantidade) || 5));
    return `Sugira ${q} temas de mensagem para: ${tipo}.${c.publico ? ` Público: ${txt(c.publico, 120)}.` : ""} Cada tema deve ter um texto base e 2 a 4 passagens de apoio, todas reais e bem escolhidas.\n\nFormato da resposta:\n${FORMATOS.temas}`;
  }
  if (acao === "sermao") {
    const tema = txt(c.tema, 300); if (!tema) return null;
    const passagens = lista(c.passagens, 12, 80).join("; ");
    const min = Math.min(90, Math.max(10, Number(c.duracaoMin) || 30));
    return `Escreva um esboço completo de sermão sobre o tema: "${tema}".\nTexto base: ${txt(c.textoBase, 80) || "escolha o mais adequado"}.${passagens ? `\nPassagens de apoio: ${passagens}.` : ""}\nTipo de culto: ${txt(c.tipo, 120) || "culto geral"}. Duração aproximada: ${min} minutos. Público: ${txt(c.publico, 120) || "igreja em geral"}. Estilo: ${txt(c.estilo, 80) || "expositivo, simples e aplicado"}.${c.observacoes ? `\nObservações do pregador: ${txt(c.observacoes, 600)}` : ""}\nUse de 3 a 5 pontos. Os campos "titulo", "tema" e "textoBase" devem vir preenchidos.\n\nFormato da resposta:\n${FORMATOS.sermao}`;
  }
  if (acao === "reescrever") {
    const t = txt(c.texto, 4000), ins = txt(c.instrucao, 400); if (!t || !ins) return null;
    return `Reescreva a seção "${txt(c.secao, 40) || "texto"}" de um sermão, seguindo a instrução do pregador, sem inventar versículos.\nInstrução: ${ins}\n\nTexto atual:\n${t}\n\nFormato da resposta:\n${FORMATOS.reescrever}`;
  }
  return null;
}

// Garante o formato e o tamanho do que a IA devolveu (nunca confiamos cegamente no que vem de fora)
export function normalizar(acao, o) {
  if (!o || typeof o !== "object") return null;
  if (acao === "interpretar") { const r = { contexto: txt(o.contexto, 1500), significado: txt(o.significado, 3500), aplicacao: txt(o.aplicacao, 1800), referencias: lista(o.referencias, 8, 80), observacao: txt(o.observacao, 800) }; return r.significado || r.contexto ? r : null; }
  if (acao === "palavra") { const r = { resumo: txt(o.resumo, 1200), origem: txt(o.origem, 1200), contexto: txt(o.contexto, 1500), usoBiblico: txt(o.usoBiblico, 1500), curiosidades: lista(o.curiosidades, 5, 400) }; return r.resumo ? r : null; }
  if (acao === "temas") {
    const temas = (Array.isArray(o.temas) ? o.temas : []).slice(0, 8).map((t) => ({ titulo: txt(t && t.titulo, 140), resumo: txt(t && t.resumo, 500), textoBase: txt(t && t.textoBase, 80), passagens: (Array.isArray(t && t.passagens) ? t.passagens : []).slice(0, 6).map((p) => ({ ref: txt(p && p.ref, 80), nota: txt(p && p.nota, 300) })).filter((p) => p.ref) })).filter((t) => t.titulo);
    return temas.length ? { temas } : null;
  }
  if (acao === "sermao") {
    const pontos = (Array.isArray(o.pontos) ? o.pontos : []).slice(0, 8).map((p) => ({ titulo: txt(p && p.titulo, 160), texto: txt(p && p.texto, 4000), versiculos: lista(p && p.versiculos, 8, 80), ilustracao: txt(p && p.ilustracao, 1500) })).filter((p) => p.titulo || p.texto);
    const r = { titulo: txt(o.titulo, 160), tema: txt(o.tema, 300), textoBase: txt(o.textoBase, 80), introducao: txt(o.introducao, 3000), pontos, aplicacao: txt(o.aplicacao, 2500), conclusao: txt(o.conclusao, 2500), apelo: txt(o.apelo, 1500), perguntas: lista(o.perguntas, 8, 300), dicas: lista(o.dicas, 10, 400) };
    return r.titulo && pontos.length ? r : null;
  }
  if (acao === "reescrever") { const t = txt(o.texto, 5000); return t ? { texto: t } : null; }
  return null;
}

const MAX_TOKENS = { interpretar: 2500, palavra: 1800, temas: 4000, sermao: 8000, reescrever: 2500 };
const PUBLICAS = ["interpretar", "palavra"];
const ADMIN = ["temas", "sermao", "reescrever"];

export const config = { maxDuration: 60 }; // sermões completos levam mais de 10 s

export default async function handler(req, res, ambiente = process.env, buscar = fetch, agora = Date.now()) {
  cors(req, res);
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") return resposta(res, 405, { ok: false, motivo: "metodo" });
  let c = req.body;
  if (typeof c === "string") { try { c = JSON.parse(c); } catch (e) { c = null; } }
  if (!c || typeof c !== "object") return resposta(res, 400, { ok: false, motivo: "corpo_invalido" });
  const chave = String(ambiente.ANTHROPIC_API_KEY || "").trim();
  const acao = String(c.acao || "");
  if (acao === "status") return resposta(res, 200, { ok: true, ligada: !!chave });
  if (!PUBLICAS.includes(acao) && !ADMIN.includes(acao)) return resposta(res, 400, { ok: false, motivo: "acao_invalida" });

  const segredo = ambiente.TOKEN_SECRET;
  const auth = String((req.headers && req.headers.authorization) || "");
  const sessao = auth.startsWith("Bearer ") && segredo && segredo.length >= 16 ? verificar(auth.slice(7), segredo, agora) : null;
  const admin = !!(sessao && sessao.papel === "admin");
  // Quem recebeu o código da área de sermões também usa a IA de sermões (o servidor confere se o acesso continua liberado).
  const sermonista = !admin && !!(sessao && sessao.papel === "sermonista") && (await sermonistaAtivo(sessao.i, agora));
  if (ADMIN.includes(acao) && !admin && !sermonista) return resposta(res, 401, { ok: false, motivo: "sem_sessao" });
  if (!chave) return resposta(res, 200, { ok: false, motivo: "ia_desligada" });

  const ip = String((req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "?").split(",")[0].trim();
  if (admin) { if (estourou("adm:" + ip, 60, agora)) return resposta(res, 429, { ok: false, motivo: "limite" }); }
  else if (sermonista) { if (estourou("srm:" + sessao.i, 40, agora)) return resposta(res, 429, { ok: false, motivo: "limite" }); }
  else {
    if (estourou(ip, Math.max(1, Number(ambiente.IA_LIMITE_PUBLICO) || 8), agora)) return resposta(res, 429, { ok: false, motivo: "limite" });
    if (tetoDoDia(Math.max(1, Number(ambiente.IA_LIMITE_DIA) || 300), agora)) return resposta(res, 429, { ok: false, motivo: "limite_do_dia" });
  }
  const pedido = montar(acao, c);
  if (!pedido) return resposta(res, 400, { ok: false, motivo: "pedido_invalido" });

  try {
    let parada = "";
    for (let tentativa = 1; tentativa <= 2; tentativa++) { // se a resposta vier torta, tenta mais uma vez
      const r = await buscar(API_IA, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": chave, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: String(ambiente.IA_MODELO || MODELO_PADRAO), max_tokens: MAX_TOKENS[acao], system: SISTEMA, messages: [{ role: "user", content: pedido }] }),
      });
      if (!r.ok) return resposta(res, 502, { ok: false, motivo: r.status === 401 || r.status === 403 ? "chave_recusada" : r.status === 429 ? "ia_ocupada" : "falha_ia" });
      const j = await r.json();
      parada = String((j && j.stop_reason) || "");
      const texto = Array.isArray(j && j.content) ? j.content.filter((b) => b && b.type === "text").map((b) => b.text).join("\n") : "";
      const dados = normalizar(acao, extrairJSON(texto));
      if (dados) return resposta(res, 200, { ok: true, dados });
    }
    return resposta(res, 502, { ok: false, motivo: "resposta_invalida", parada });
  } catch (e) {
    return resposta(res, 502, { ok: false, motivo: "falha_ia" });
  }
}
