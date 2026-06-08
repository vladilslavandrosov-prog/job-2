import { build } from "vite";
import esbuild from "esbuild";

await build({
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});

await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  packages: "external",
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});

console.log("Build complete!");
