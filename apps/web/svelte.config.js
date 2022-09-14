import preprocess from 'svelte-preprocess'
import { optimizeImports } from 'carbon-preprocess-svelte'
import auto from '@sveltejs/adapter-auto'
import node from '@sveltejs/adapter-node'
import vercel from '@sveltejs/adapter-vercel'

const adapter = () => {
  switch (process.env.ADAPTER?.toLowerCase() || 'vercel') {
    case 'node':
      return node()
    case 'vercel':
      return vercel({ edge: true })
    default:
      return auto()
  }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [preprocess(), optimizeImports()],
  kit: {
    adapter: adapter(),
    env: {
      dir: '../../',
    },
    inlineStyleThreshold: Infinity,
  },
}

export default config
