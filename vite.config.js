import { defineConfig, loadEnv } from "vite";
import { Readable } from "node:stream";
import { createContactHandler } from "./server/contact.js";

export default defineConfig(({ mode }) => ({
  base: "./",
  esbuild: { jsx: "automatic" },
  plugins: [
    {
      name: "local-contact-api",
      configureServer(server) {
        const handleContact = createContactHandler({
          env: { ...process.env, ...loadEnv(mode, process.cwd(), "") },
        });
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split("?")[0] !== "/api/contact") return next();
          try {
            const request = new Request(
              `http://${req.headers.host}${req.url}`,
              {
                method: req.method,
                headers: req.headers,
                ...(req.method !== "GET" && req.method !== "HEAD"
                  ? { body: Readable.toWeb(req), duplex: "half" }
                  : {}),
              },
            );
            const response = await handleContact(request);
            res.writeHead(
              response.status,
              Object.fromEntries(response.headers),
            );
            res.end(await response.text());
          } catch {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                ok: false,
                error: "The message couldn’t be sent. Please try again later.",
              }),
            );
          }
        });
      },
    },
  ],
}));
