// WhatsApp do Ministério. TODO botão de WhatsApp do app passa por aqui (abrirConversa), de propósito:
// hoje abre a conversa no WhatsApp da pessoa (wa.me, sem custo); quando o app virar aplicativo e o WhatsApp
// passar a ser um agente (WhatsApp Business API), só este arquivo muda — nenhuma tela precisa ser refeita.
//
// Cada assunto leva uma etiqueta no fim da mensagem (#duvida, #oracao, #sermoes, #suporte). É ela que o agente
// vai usar para encaminhar a conversa ao setor certo.

export const WHATSAPP_MINISTERIO = "5585992071505"; // (85) 99207-1505 — o mesmo do botão do site do Ministério

export const ASSUNTOS = [
  { k: "duvida", rotulo: "Tirar uma dúvida", sub: "Fale com o Ministério", texto: "Tenho uma dúvida sobre o app Bíblia Avivar." },
  { k: "oracao", rotulo: "Pedido de oração", sub: "Receba oração e acolhimento", texto: "Gostaria de um pedido de oração." },
  { k: "sermoes", rotulo: "Acesso à área de sermões", sub: "Peça sua senha de acesso", texto: "Gostaria de pedir acesso à área de preparação de sermões." },
  { k: "suporte", rotulo: "Problema no app", sub: "Algo não está funcionando", texto: "Encontrei um problema no app." },
];

export const soDigitos = (v) => String(v || "").replace(/\D/g, "");
export const numeroWhats = (config) => soDigitos((config && config.whatsappAdmin) || "") || WHATSAPP_MINISTERIO;

export function mensagemWhats(assunto, ctx = {}) {
  const a = ASSUNTOS.find((x) => x.k === assunto) || ASSUNTOS[0];
  const quem = ctx.nome ? `Sou ${ctx.nome}` : "";
  const linhas = [`Paz do Senhor! ${quem}${quem ? ". " : ""}${a.texto}`];
  if (ctx.email) linhas.push(`E-mail do meu cadastro: ${ctx.email}`);
  linhas.push(`— via app Bíblia Avivar #${a.k}`);
  return linhas.join("\n");
}
export function linkWhats(numero, assunto, ctx) {
  return `https://wa.me/${soDigitos(numero) || WHATSAPP_MINISTERIO}?text=${encodeURIComponent(mensagemWhats(assunto, ctx))}`;
}

// Ponto único de entrada. Hoje: abre o WhatsApp. Futuro: se AGENTE.ativo, entrega ao agente do app.
export const AGENTE = {
  ativo: false,            // vira true quando o app tiver o agente de WhatsApp (API oficial) ligado
  endpoint: "",            // ex.: https://avivardoespirito.com.br/api/whatsapp (ainda não existe; será criado junto com o agente)
};
export function abrirConversa(config, assunto, ctx) {
  const url = linkWhats(numeroWhats(config), assunto, ctx);
  try { window.open(url, "_blank", "noopener,noreferrer"); } catch (e) { window.location.href = url; }
  return url;
}
