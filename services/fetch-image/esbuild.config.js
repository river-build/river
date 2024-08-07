import esbuild from 'esbuild';

esbuild
	.build({
		entryPoints: ['src/node.ts'],
		bundle: true,
		outfile: 'dist/node_esbuild.cjs',
		platform: 'node',
		target: 'es2022',
		sourcemap: 'inline',
		format: 'cjs',
		logLevel: 'info',
		loader: {
			'.wasm': 'file',
		},
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
