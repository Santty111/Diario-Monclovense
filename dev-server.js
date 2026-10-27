/**
 * LuminaFlip - Servidor HTTP de Desarrollo Local
 * Cero dependencias externas. Soporta módulos ES, WebP, PDF y headers CORS.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Manejo de CORS y cabeceras
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  if (req.method === "POST" && reqPath === "/api/publish-book") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const { pages } = JSON.parse(bodyBuffer.toString("utf8"));

        if (!pages || !Array.isArray(pages) || pages.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No se enviaron páginas válidas" }));
          return;
        }

        const outDir = path.join(__dirname, "assets", "monclovense");
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        // Limpiar archivos anteriores en assets/monclovense
        const existingFiles = fs.readdirSync(outDir);
        for (const file of existingFiles) {
          if (/\.(jpe?g|png|webp)$/i.test(file)) {
            try { fs.unlinkSync(path.join(outDir, file)); } catch (e) {}
          }
        }

        const bookEntries = [];

        pages.forEach((p, idx) => {
          const pageNum = String(idx + 1).padStart(2, "0");
          const fileName = `page-${pageNum}.jpg`;
          const filePath = path.join(outDir, fileName);

          const base64Data = p.dataUrl.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          fs.writeFileSync(filePath, buffer);

          bookEntries.push({
            name: p.name || `Página ${idx + 1}`,
            url: `assets/monclovense/${fileName}`,
            width: p.width || 1200,
            height: p.height || 1600,
            rotation: p.rotation || 0,
            description: `Página ${idx + 1} de Diario Monclovense`
          });
        });

        // Actualizar js/sample-book.js
        const sampleBookContent = `/**
 * Colección oficial de páginas de Diario Monclovense
 * Generada automáticamente para que persista y sea visible globalmente en cualquier navegador.
 */
export const SAMPLE_PAGES = ${JSON.stringify(bookEntries, null, 2)};
`;
        fs.writeFileSync(path.join(__dirname, "js", "sample-book.js"), sampleBookContent, "utf8");

        // Ejecutar git commit y push
        let gitSuccess = false;
        try {
          execSync("git add assets/monclovense/ js/sample-book.js", { cwd: __dirname });
          execSync("git commit -m \"feat(book): publish custom book as global default\" || true", { cwd: __dirname });
          execSync("git push origin main", { cwd: __dirname });
          gitSuccess = true;
          console.log("✓ Libro publicado y subido a GitHub/Vercel exitosamente");
        } catch (gitErr) {
          console.error("Aviso en git sync:", gitErr.message);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: bookEntries.length, gitSynced: gitSuccess }));
      } catch (err) {
        console.error("Error en /api/publish-book:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }


  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 No Encontrado: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

let currentPort = PORT;

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LuminaFlip Dev Server activo en: http://localhost:${port}`);
    console.log(`📖 Flipbook interactivo listo para visualización y pruebas`);
    console.log(`======================================================\n`);
  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`⚠️ Puerto ${currentPort} ocupado, intentando puerto ${currentPort + 1}...`);
    currentPort++;
    startServer(currentPort);
  } else {
    console.error("Error del servidor:", err);
  }
});

startServer(currentPort);
