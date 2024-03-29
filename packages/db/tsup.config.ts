import { defineConfig } from 'tsup'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/utils/index.ts'],
  format: ['esm', 'cjs'],
  minify: isProduction,
  sourcemap: true,
})
