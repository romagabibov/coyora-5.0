import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Read firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const server = express();
  const PORT = 3000;

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    server.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    server.use(express.static(distPath, { index: false }));
  }

  server.get('*', async (req, res) => {
    try {
      let template: string;
      
      if (process.env.NODE_ENV !== "production") {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }

      // Fetch branding from Firestore
      try {
        const brandingDoc = await getDoc(doc(db, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          const brandingData = brandingDoc.data().data;
          
          if (brandingData?.ogImageUrl) {
            template = template.replace(
              /<meta property="og:image" content="[^"]*" \/>/g,
              `<meta property="og:image" content="${brandingData.ogImageUrl}" />`
            );
            // Also update JSON-LD image if present
            template = template.replace(
              /"image":\s*"[^"]*"/g,
              `"image": "${brandingData.ogImageUrl}"`
            );
          }
          
          if (brandingData?.faviconUrl) {
            template = template.replace(
              /<link rel="icon" type="image\/jpeg" href="[^"]*" \/>/g,
              `<link rel="icon" href="${brandingData.faviconUrl}" />`
            );
          }
          
          if (brandingData?.logoUrl) {
            template = template.replace(
              /"logo":\s*"[^"]*"/g,
              `"logo": "${brandingData.logoUrl}"`
            );
          }
        }
      } catch (err) {
        console.error("Error fetching branding for SSR:", err);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
