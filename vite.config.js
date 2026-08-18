import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const entry = (path) => fileURLToPath(new URL(path, import.meta.url))

// Static build output, deployable to Vercel / Cloudflare Pages without a
// server. Two entries: the course app at /, and a standalone build of the
// About page (mission / activity record / team) at /about/, which can be
// shared on its own without exposing the course prototype.
//
// base must be absolute, not relative: the /about/ entry lives one directory
// deep, so relative asset URLs would resolve to /about/assets/.
//
// A GitHub Pages *project* site is served from a sub-path, so the base has to
// match the repository name. Set it at build time and nothing else changes:
//
//   BASE_PATH=/WA-Site/ npm run build
//
// Paths that Vite does not generate itself (photos and videos referenced from
// data/*.json) go through src/utils/asset.js, which prefixes the same value.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base: base.endsWith('/') ? base : `${base}/`,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: entry('index.html'),
        about: entry('about/index.html'),
      },
    },
  },
})
