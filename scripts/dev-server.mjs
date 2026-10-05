import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const requestedRoot = process.argv[2] || "src";
const siteRoot = resolve(projectRoot, requestedRoot);
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

await access(resolve(siteRoot, "index.html"));

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const candidate = resolve(siteRoot, `.${pathname === "/" ? "/index.html" : pathname}`);

    if (candidate !== siteRoot && !candidate.startsWith(`${siteRoot}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const fileStats = await stat(candidate);
    const file = fileStats.isDirectory() ? resolve(candidate, "index.html") : candidate;
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Sukun Café is running at http://localhost:${port}`);
  console.log(`Serving ${siteRoot}`);
});
