// Tiny Node ESM loader so local scripts can run the app's own TypeScript
// (Node 24 strips types natively; this only maps "@/..." and bare relative
// imports to .ts files). Used by scripts/daily-outreach.mjs.
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return { url: pathToFileURL(path.join(SRC, specifier.slice(2) + ".ts")).href, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier) && context.parentURL?.startsWith("file:")) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    for (const ext of [".ts", ".tsx"]) {
      if (fs.existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context);
}
