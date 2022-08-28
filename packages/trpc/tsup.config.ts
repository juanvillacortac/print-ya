import { config } from 'dotenv'
import { defineConfig } from 'tsup'

config({
  path: '../../.env',
})

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  env: {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
    PUBLIC_GEOAPIFY_TOKEN: process.env.PUBLIC_GEOAPIFY_TOKEN || '',
    PUBLIC_UPSTASH_REDIS_URL: process.env.PUBLIC_UPSTASH_REDIS_URL || '',
    PUBLIC_UPSTASH_REDIS_TOKEN: process.env.PUBLIC_UPSTASH_REDIS_TOKEN || '',
    REDIS_URL: process.env.REDIS_URL || '',
  },
  format: ['esm', 'cjs'],
  minify: isProduction,
  sourcemap: true,
})
