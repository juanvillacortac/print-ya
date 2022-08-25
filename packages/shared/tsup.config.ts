import { config } from 'dotenv'
import { defineConfig } from 'tsup'

config({
  path: '../../.env',
})

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  clean: true,
  dts: true,
  env: {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || '',
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || '',
    __LOCALHOST_HOST__: process.env.GITPOD_WORKSPACE_URL
      ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '5173-')
      : 'localhost:5173',
    __VERCEL_URL__: process.env.VERCEL_URL || '',
  },
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: isProduction,
  sourcemap: true,
})
