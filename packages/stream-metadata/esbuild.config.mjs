import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

// Common configuration
const commonConfig = {
	bundle: true,
	format: "cjs",
	logLevel: "info",
	loader: {
		".ts": "ts",
		".wasm": "file",
	},
	external: [
		// esbuild cannot bundle native modules
		"@datadog/native-metrics",

		// required if you use profiling
		"@datadog/pprof",

		// required if you encounter graphql errors during the build step
		"graphql/language/visitor",
		"graphql/language/printer",
		"graphql/utilities",
		"worker_threads", // Add this to ensure worker_threads is not bundled
	],
	outdir: "dist",
	outExtension: { ".js": ".cjs" }, // Ensure the output file has .cjs extension
	platform: "node",
	plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
	sourcemap: true,
	target: "es2022",
	minify: false,
	treeShaking: true,
};

// Main application build
build({
	...commonConfig,
	entryPoints: { node_esbuild: "./src/node.ts" },
}).catch((e) => {
	console.error(e);
	process.exit(1);
});

// Worker thread build
build({
	...commonConfig,
	entryPoints: { unpackStreamWorker: "./src/unpackStreamWorker.ts" },
}).catch((e) => {
	console.error(e);
	process.exit(1);
});
