import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tiktok/user/:username", async (req, res) => {
  const { username } = req.params;
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  if (!apiKey || !apiHost) {
    return res.status(500).json({ error: "RapidAPI credentials not configured" });
  }

  try {
    const response = await axios.get(`https://${apiHost}/user/info`, {
      params: { unique_id: username },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    });

    const data = response.data;
    if (data && data.code === 0 && data.data) {
      const user = data.data.user;
      const stats = data.data.stats;
      res.json({
        username: user.uniqueId,
        displayName: user.nickname,
        profilePicture: user.avatarLarger || user.avatarMedium || user.avatarThumb,
        followerCount: stats.followerCount,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error: any) {
    console.error("TikTok API error:", error.message);
    res.status(500).json({ error: "Failed to fetch TikTok profile" });
  }
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
