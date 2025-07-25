import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const PYODIDE_INCLUDE = [
    'package.json',
    'pyodide-lock.json',
    'pyodide.asm.js',
    'pyodide.asm.wasm',
    'pyodide.js',
    'pyodide.js.map',
    'pyodide.mjs',
    'pyodide.mjs.map',
    'python_stdlib.zip',
    'whl/*.whl',
]

export function viteStaticCopyPyodide() {
    const pyodideDir = dirname(fileURLToPath(import.meta.resolve('pyodide')))
    return viteStaticCopy({
        targets: [
            {
                src: PYODIDE_INCLUDE.map((file) => join(pyodideDir, file)),
                dest: 'assets',
            },
        ],
    })
}

// https://vite.dev/config/
export default defineConfig({
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['pyodide'],
    },
    plugins: [
        vue({
            template: { transformAssetUrls },
        }),
        quasar({
            sassVariables: fileURLToPath(new URL('./src/css/quasar-variables.sass', import.meta.url)),
        }),
        viteStaticCopyPyodide(),
    ],
})
