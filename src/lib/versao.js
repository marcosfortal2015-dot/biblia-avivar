// Versão do app: o build grava um código em /versao.json (e dentro do próprio app). Se o código do servidor for diferente do
// que está rodando, existe versão nova. O aviso só aparece nesse caso, e uma vez por versão.
import { useEffect, useState } from "react";

export const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";
const K_VISTO = "biblia:versao-aviso";   // versão nova cujo aviso já foi fechado
const K_TENTOU = "biblia:versao-tentou"; // versão nova que já tentamos instalar (evita laço se o aparelho guardar a antiga)

const estado = { servidor: "", nova: false };
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => { try { f(); } catch (e) { /* ok */ } });
const lerLS = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
const gravarLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } };

export async function checarVersao() {
  if (BUILD_ID === "dev") return false;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return estado.nova;
    const r = await fetch("/versao.json?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return estado.nova;
    const j = await r.json();
    if (!j || typeof j.id !== "string" || !j.id) return estado.nova;
    const nova = j.id !== BUILD_ID;
    if (nova !== estado.nova || j.id !== estado.servidor) { estado.servidor = j.id; estado.nova = nova; avisar(); }
  } catch (e) { /* sem internet ou arquivo ausente: não diz nada */ }
  return estado.nova;
}

// Limpa os arquivos guardados do app (menos o pacote "sem internet" da Bíblia) e recarrega.
export async function atualizarAgora() {
  if (estado.servidor) gravarLS(K_TENTOU, estado.servidor);
  try {
    const regs = (navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? await navigator.serviceWorker.getRegistrations() : []) || [];
    await Promise.all(regs.map((r) => r.update().catch(() => {})));
  } catch (e) { /* ok */ }
  try {
    if (typeof caches !== "undefined") {
      const ks = await caches.keys();
      await Promise.all(ks.filter((k) => !k.startsWith("biblia-avivar-offline")).map((k) => caches.delete(k)));
    }
  } catch (e) { /* ok */ }
  window.location.reload();
}

export function dispensarAviso() { if (estado.servidor) gravarLS(K_VISTO, estado.servidor); avisar(); }

let iniciado = false;
export function iniciarVersao() {
  if (iniciado || BUILD_ID === "dev" || typeof window === "undefined") return;
  iniciado = true;
  setTimeout(checarVersao, 4000);
  setInterval(checarVersao, 10 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checarVersao(); });
}

// nova: existe versão nova. avisar: deve abrir o aviso (nova, ainda não fechado e ainda não tentado).
export function useVersao() {
  const [, forca] = useState(0);
  useEffect(() => { const f = () => forca((n) => n + 1); ouvintes.add(f); iniciarVersao(); return () => ouvintes.delete(f); }, []);
  const avisarAgora = estado.nova && lerLS(K_VISTO) !== estado.servidor && lerLS(K_TENTOU) !== estado.servidor;
  return { nova: estado.nova, avisar: avisarAgora, atualizarAgora, dispensar: dispensarAviso, checar: checarVersao };
}
