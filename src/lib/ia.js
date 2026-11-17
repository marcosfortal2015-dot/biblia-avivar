// Cliente da IA: fala com o servidor do Ministério (/api/ia), que guarda a chave. O navegador nunca vê a chave.
import { tokenAdmin } from "./storage.js";
import { tokenSermonista } from "./conta.js";
const API_IA = "https://avivardoespirito.com.br/api/ia";
let statusP = null;
export function iaLigada(forcar = false) {
  if (!statusP || forcar) {
    statusP = fetch(API_IA, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "status" }) })
      .then((r) => r.json()).then((j) => !!(j && j.ok && j.ligada)).catch(() => false);
  }
  return statusP;
}
// acao: interpretar | palavra (público) · temas | sermao | reescrever (administrador)
export async function iaPedir(acao, corpo) {
  try {
    const t = tokenAdmin() || tokenSermonista();
    const res = await fetch(API_IA, { method: "POST", headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify({ ...corpo, acao }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j && j.ok) return { ok: true, dados: j.dados };
    return { ok: false, motivo: (j && j.motivo) || (res.status === 429 ? "limite" : "falha_ia") };
  } catch (e) { return { ok: false, motivo: "sem_conexao" }; }
}
export const MOTIVOS_IA = {
  ia_desligada: ["ia.desligada", "A inteligência artificial ainda não foi ativada neste app. Peça ao administrador para colocar a chave."],
  limite: ["ia.limite", "Você já usou a IA várias vezes nesta hora. Tente de novo daqui a pouco."],
  limite_do_dia: ["ia.limiteDia", "O limite de pedidos de hoje foi atingido. Tente amanhã."],
  sem_sessao: ["ia.semSessao", "Entre na área de sermões para usar esta função."],
  sem_conexao: ["ia.semConexao", "Sem conexão com o servidor. Confira a internet."],
  chave_recusada: ["ia.chaveRecusada", "A chave da IA foi recusada. O administrador precisa conferi-la."],
  ia_ocupada: ["ia.ocupada", "A IA está ocupada agora. Tente em instantes."],
  resposta_invalida: ["ia.respostaInvalida", "A IA respondeu fora do formato. Tente de novo."],
};
