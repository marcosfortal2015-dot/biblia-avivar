// Aviso "Nova versão disponível" do app Bíblia Avivar.
// Só aparece quando o servidor publicou uma versão diferente da que está rodando (código do build em /versao.json),
// e uma única vez por versão: se a pessoa fechar o aviso, ele não volta (o botão fica no menu).
import React from "react";
import { useVersao } from "./lib/versao.js";

export default function AvisoNovaVersao() {
  const v = useVersao();
  if (!v.avisar) return null;
  return (
    <div
      role="status" aria-live="polite" data-testid="aviso-nova-versao"
      style={{ position: "fixed", left: 12, right: 12, bottom: 84, zIndex: 9999, margin: "0 auto", maxWidth: 440, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 16, background: "#1b0e42", color: "#F5F1E6", border: "1.5px solid #C9A24B", boxShadow: "0 10px 30px #000a" }}
    >
      <p style={{ flex: 1, margin: 0, fontSize: 14, lineHeight: 1.35 }}><b style={{ color: "#C9A24B" }}>Nova versão disponível.</b> Toque em atualizar para usar as novidades.</p>
      <button onClick={v.atualizarAgora} data-testid="aviso-atualizar" style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: 0, background: "#C9A24B", color: "#0B0B0C", fontWeight: 700, fontSize: 14, flexShrink: 0, cursor: "pointer" }}>Atualizar</button>
      <button onClick={v.dispensar} aria-label="Agora não" data-testid="aviso-fechar" style={{ minHeight: 44, width: 36, border: 0, background: "transparent", color: "#F5F1E6", fontSize: 20, flexShrink: 0, cursor: "pointer" }}>×</button>
    </div>
  );
}
