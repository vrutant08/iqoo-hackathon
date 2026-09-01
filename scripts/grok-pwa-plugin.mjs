import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptsHtml,
  createHeadInjector,
  isDocumentPath,
  isInstallQuery,
  renderInstallPageHtml,
  renderWebManifest,
  snapshotOgIdentity,
} from "./grok-pwa-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const installPageTemplate = readFileSync(join(__dirname, "install-page.html"), "utf8");

export function renderInstallPage(host, url) {
  return renderInstallPageHtml(installPageTemplate, { host, url });
}

export function grokPwaPlugin() {
  const virtualModuleId = "virtual:grok-og-identity";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let root = process.cwd();

  return {
    name: "grok-pwa-plugin",
    configResolved(config) {
      root = config.root || process.cwd();
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const identity = snapshotOgIdentity(root);
        return `export const grokOgIdentity = ${JSON.stringify(identity)};\nexport default grokOgIdentity;\n`;
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? "";
        const [pathOnly] = rawUrl.split("?", 2);
        const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080");

        if (pathOnly === "/__grok/manifest.webmanifest" || pathOnly === "/__grok/manifest.json") {
          res.setHeader("content-type", "application/manifest+json; charset=utf-8");
          res.setHeader("cache-control", "no-cache");
          res.end(renderWebManifest(host));
          return;
        }

        if (isInstallQuery(rawUrl) && isDocumentPath(pathOnly) && acceptsHtml(req.headers.accept)) {
          res.setHeader("content-type", "text/html; charset=utf-8");
          res.setHeader("cache-control", "no-cache");
          res.end(renderInstallPage(host, rawUrl));
          return;
        }

        next();
      });
    },
    transformIndexHtml(html) {
      const injector = createHeadInjector({ cwd: root });
      const chunks = injector.push(Buffer.from(html, "utf8")).concat(injector.flush());
      return Buffer.concat(chunks).toString("utf8");
    },
  };
}
