import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Código único deste build. Vai para dentro do app (__BUILD_ID__) e para /versao.json: o app compara os dois
// para saber se existe versão nova (o aviso de atualização só abre nesse caso).
const BUILD_ID = Date.now().toString(36);
const versaoJson = () => ({
  name: "versao-json",
  generateBundle() { this.emitFile({ type: "asset", fileName: "versao.json", source: JSON.stringify({ id: BUILD_ID }) }); },
});

export default defineConfig({
  plugins: [react(), versaoJson()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
});
