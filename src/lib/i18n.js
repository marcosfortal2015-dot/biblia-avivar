// Idiomas do app. Como funciona:
//  - O texto em português fica no próprio código:   t("chave", "Texto em português", { variaveis })
//  - Cada outro idioma é um arquivo em src/lang/<id>.js com { "chave": "texto traduzido" }.
//  - Faltou a tradução? Mostra o português (nada quebra).
// Para ACRESCENTAR um idioma: 1) crie src/lang/<id>.js (copie src/lang/en.js e traduza os valores);
// 2) importe aqui e inclua em DICT e IDIOMAS; 3) (opcional) acrescente uma tradução da Bíblia em src/lib/biblia.js (TRADUCOES).
// O arquivo src/lang/pt.js é GERADO por "node scripts/extrair-textos.mjs" e lista todas as chaves com o português: serve de guia para tradutores.
import { useSyncExternalStore } from "react";
import en from "../lang/en.js";
import es from "../lang/es.js";

export const IDIOMAS = [
  { id: "pt", nome: "Português", curto: "PT", fala: "pt-BR" },
  { id: "en", nome: "English", curto: "EN", fala: "en-US" },
  { id: "es", nome: "Español", curto: "ES", fala: "es-ES" },
];
const DICT = { pt: {}, en, es };
const CHAVE = "biblia:idioma";
const ouvintes = new Set();
function inicial() {
  try {
    // Só muda de idioma se a pessoa escolher no seletor (o app ainda é majoritariamente em português).
    const salvo = localStorage.getItem(CHAVE);
    return salvo && DICT[salvo] ? salvo : "pt";
  } catch (e) { return "pt"; }
}
let atual = inicial();
export const idioma = () => atual;
export const falaDoIdioma = () => (IDIOMAS.find((i) => i.id === atual) || IDIOMAS[0]).fala;
export function setIdioma(id) {
  if (!DICT[id] || id === atual) return;
  atual = id;
  try { localStorage.setItem(CHAVE, id); } catch (e) { /* sem armazenamento */ }
  try { document.documentElement.lang = id === "pt" ? "pt-BR" : id; } catch (e) { /* ok */ }
  ouvintes.forEach((f) => f());
}
export function t(chave, padrao, vars) {
  let s = (DICT[atual] && DICT[atual][chave]) || padrao || chave;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  return s;
}
// Em componentes: const [lang] = useIdioma();  (faz a tela se redesenhar quando o idioma muda)
export function useIdioma() {
  const lang = useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => atual, () => "pt");
  return [lang, setIdioma];
}
