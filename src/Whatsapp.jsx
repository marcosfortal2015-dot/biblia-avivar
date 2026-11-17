/* Botão flutuante do WhatsApp (fala direto com o Ministério) + ícone para usar nos menus. */
import React, { useState } from "react";
import { X } from "lucide-react";
import { ASSUNTOS, abrirConversa } from "./lib/whatsapp.js";

const VERDE = "#25D366";
const CAMINHO = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

// Mesma assinatura dos ícones do lucide (size, color), para entrar nos menus.
export function IconeWhats({ size = 24, color = "currentColor", ...r }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...r}><path d={CAMINHO} /></svg>;
}

export function BotaoWhatsapp({ config, ctx, abertoInicial = false }) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <>
      {aberto && (
        <div role="dialog" aria-label="Falar com o Ministério pelo WhatsApp" data-testid="whats-painel"
          style={{ position: "fixed", right: 14, bottom: 150, zIndex: 45, width: "min(320px, calc(100vw - 28px))", borderRadius: 18, background: "#fffdf8", color: "#1F1B2E", border: "1.5px solid #CBA135", boxShadow: "0 14px 40px #000a", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: VERDE, color: "#06371a" }}>
            <IconeWhats size={26} color="#06371a" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>Fale com o Ministério</p>
              <p style={{ margin: 0, fontSize: 12 }}>Escolha o assunto e o WhatsApp abre</p>
            </div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ border: 0, background: "transparent", color: "#06371a", cursor: "pointer", minHeight: 40, minWidth: 40 }}><X size={20} /></button>
          </div>
          <div style={{ padding: 8 }}>
            {ASSUNTOS.map((a) => (
              <button key={a.k} data-testid={"whats-" + a.k} onClick={() => { abrirConversa(config, a.k, ctx); setAberto(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "10px 12px", borderRadius: 12, cursor: "pointer", minHeight: 48 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{a.rotulo}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "#5b5470" }}>{a.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setAberto((v) => !v)} data-testid="whats-botao" aria-label="Falar com o Ministério pelo WhatsApp" aria-expanded={aberto}
        style={{ position: "fixed", right: 14, bottom: 84, zIndex: 45, width: 56, height: 56, borderRadius: "50%", border: "2px solid #ffffffcc", background: VERDE, boxShadow: "0 6px 18px #0009", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <IconeWhats size={32} color="#fff" />
      </button>
    </>
  );
}
