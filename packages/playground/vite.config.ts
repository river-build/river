import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { default as checker } from 'vite-plugin-checker'
import path from 'path'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return defineConfig({
        define: {
            'process.env': env,
        },
        plugins: [
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
                },
            }),
            react(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 3000,
        },
    })
}
