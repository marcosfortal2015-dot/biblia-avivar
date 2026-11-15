// Aviso "Nova versão disponível" do app Bíblia Avivar.
// De tempos em tempos (e quando o app volta para a tela) compara o arquivo principal que está rodando
// com o que o servidor publicou. Se mudou, mostra o aviso; quem decide atualizar é a pessoa (botão).
// Não faz nada em modo de desenvolvimento nem sem internet.
import React, { useEffect, useState } from "react";

export default function AvisoNovaVersao() {
  const [nova, setNova] = useState(false);
  useEffect(() => {
    let vivo = true;
    const rodando = (Array.from(document.scripts).map((x) => x.src).find((u) => /\/assets\/[^/]+\.js/.test(u)) || "").split("/assets/")[1] || "";
    if (!rodando) return undefined;
    const checar = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine === false) return;
        const r = await fetch("/index.html?v=" + Date.now(), { cache: "no-store" });
        if (!r.ok) return;
        const m = (await r.text()).match(/<script[^>]*src="[^"]*\/assets\/([^"]+\.js)"/);
        if (vivo && m && m[1] !== rodando) setNova(true);
      } catch (e) { /* sem internet: tenta depois */ }
    };
    const t0 = setTimeout(checar, 8000);
    const iv = setInterval(checar, 10 * 60 * 1000);
    const vis = () => { if (document.visibilityState === "visible") checar(); };
    document.addEventListener("visibilitychange", vis);
    return () => { vivo = false; clearTimeout(t0); clearInterval(iv); document.removeEventListener("visibilitychange", vis); };
  }, []);
  const atualizar = async () => {
    try {
      const regs = (await (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations() : [])) || [];
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
    } catch (e) { /* ok */ }
    window.location.reload();
  };
  if (!nova) return null;
  return (
    <div
      role="status" aria-live="polite" data-testid="aviso-nova-versao"
      style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999, margin: "0 auto", maxWidth: 440, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 16, background: "#0B0B0C", color: "#F5F1E6", border: "1.5px solid #C9A24B", boxShadow: "0 10px 30px rgba(0,0,0,.45)", fontFamily: "system-ui, sans-serif" }}
    >
      <p style={{ flex: 1, margin: 0, fontSize: 14, lineHeight: 1.35 }}><b style={{ color: "#C9A24B" }}>Nova versão disponível.</b> Toque em atualizar para usar as novidades.</p>
      <button onClick={atualizar} style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: 0, background: "#C9A24B", color: "#0B0B0C", fontWeight: 700, fontSize: 14, flexShrink: 0, cursor: "pointer" }}>Atualizar</button>
      <button onClick={() => setNova(false)} aria-label="Agora não" style={{ minHeight: 44, width: 36, border: 0, background: "transparent", color: "#F5F1E6", fontSize: 20, flexShrink: 0, cursor: "pointer" }}>×</button>
    </div>
  );
}
