import { build } from "esbuild";
import { wasmLoader } from "esbuild-plugin-wasm";

build({
  entryPoints: ["./src/start.ts", "./src/demo.ts"],
  bundle: true,
  sourcemap: "inline",
  platform: "node",
  target: "node20",
  format: "cjs",
  outdir: "dist",
  plugins: [wasmLoader()],
  ignoreAnnotations: true,
  loader: {
    ".ts": "ts",
    ".wasm": "file",
  },
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
