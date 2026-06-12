import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = existsSync("dist") ? "dist" : ".";
const contentType = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".md": "text/markdown; charset=utf-8"
};

Bun.serve({
  port: Number(process.env.PORT || 4173),
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const safePath = normalize(pathname).replace(/^\.\.(\/|\\|$)/, "");
    const filePath = join(root, safePath);

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }

    const type = contentType[extname(filePath).toLowerCase()] || "application/octet-stream";
    return new Response(file, { headers: { "content-type": type } });
  }
});

console.log(`Serving ${root} at http://localhost:${Number(process.env.PORT || 4173)}`);
