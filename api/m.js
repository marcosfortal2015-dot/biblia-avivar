// Função do Vercel: devolve uma página com as "tags de pré-visualização" (Open Graph)
// do versículo, para o WhatsApp/Telegram mostrarem título e texto no link.
// Quem abre o link no navegador é levado na hora para o app (/?m=...).

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function decodeMsg(m) {
  try {
    const json = Buffer.from(m.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const o = JSON.parse(json);
    return o && typeof o.t === "string" && o.t ? o : null;
  } catch (e) {
    return null;
  }
}

export default function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const m = url.searchParams.get("m") || "";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "biblia-avivar.vercel.app";
  const site = `https://${host}`;

  if (!/^[A-Za-z0-9_-]{1,4000}$/.test(m)) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
    return;
  }
  const msg = decodeMsg(m);
  if (!msg) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
    return;
  }

  const ref = String(msg.r || "Bíblia Avivar").slice(0, 80);
  let texto = String(msg.t).replace(/\s+/g, " ").trim();
  if (texto.length > 220) texto = texto.slice(0, 217).trimEnd() + "...";

  const title = `${ref} — Uma palavra para você`;
  const desc = `“${texto}” · Toque para abrir com música. Bíblia Avivar`;
  const self = `${site}/api/m?m=${m}`;
  const target = `/?m=${m}`;
  const image = `${site}/og-biblia-avivar.jpg`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bíblia Avivar">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(self)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1B1035;color:#FBF6ED;font-family:Georgia,serif;text-align:center;padding:24px}a{color:#E9C765}</style>
</head>
<body>
<p>${esc(ref)}<br><br><a href="${esc(target)}">Abrir a mensagem</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.end(html);
}
