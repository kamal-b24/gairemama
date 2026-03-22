import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function setupApp() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production / Vercel
    // Note: In Vercel, static files are usually served via vercel.json routes
    // but we keep this as a fallback.
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      console.log(`Serving index.html from: ${indexPath}`);
      res.sendFile(indexPath);
    });
  }
}

// For AI Studio / Local development
if (!process.env.VERCEL) {
  setupApp().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // On Vercel, we only need the production static serving
  const distPath = path.resolve(__dirname, 'dist');
  console.log(`Vercel mode: Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  
  // Only handle routes that aren't static files
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Vercel mode: Found index.html at: ${indexPath}`);
      res.sendFile(indexPath);
    } else {
      console.error(`Vercel mode: index.html NOT FOUND at: ${indexPath}`);
      res.status(404).send('Not Found: index.html is missing. Please check the build process.');
    }
  });
}

export default app;
