import { build } from 'esbuild';

build({
		bundle: true,
		entryPoints: ['src/node.ts'],
		format: 'cjs',
		logLevel: 'info',
		loader: {
			'.ts': 'ts',
			'.wasm': 'file',
		},
		outdir: 'dist',
		outExtension: { ".js": ".cjs" },
		platform: 'node',
		sourcemap: 'inline',
		target: 'es2022',
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
