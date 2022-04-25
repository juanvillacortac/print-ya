import preprocess from 'svelte-preprocess'
import { optimizeImports } from 'carbon-preprocess-svelte'
import { imagetools } from 'vite-imagetools'
import auto from '@sveltejs/adapter-auto'
import node from '@sveltejs/adapter-node'
import svg from '@poppanator/sveltekit-svg'
import WindiCSS from 'vite-plugin-windicss'

const adapter = () => {
  switch (process.env.ADAPTER?.toLowerCase()) {
    case 'node':
      return node()
    default:
      return auto()
  }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess(),
    // windi({
    //   silent: true,
    //   configPath: './windi.config.js',
    // }),
    optimizeImports(),
  ],
  kit: {
    adapter: adapter(),
    // hydrate the <div id="svelte"> element in src/app.html
    methodOverride: {
      parameter: '_method',
      allowed: ['PUT', 'PATCH', 'DELETE'],
    },
    inlineStyleThreshold: 48 / 0.0009765625,
    vite: {
      plugins: [
        WindiCSS({
          config: './windi.config.js',
        }),
        svg(),
        imagetools(),
        // gQueryCodegen({
        //   // Required
        //   schema: './src/lib/schema.graphql', // path to schema, schema is required
        //   out: './src/lib/gquery', // Where you want the general schema types to output
        //   gPath: '$lib/config/g', // Path to g, created in step 1.
        // }),
      ],
      server: {
        hmr: {
          clientPort: process.env.GITPOD_WORKSPACE_URL ? 443 : 3000,
          host: process.env.GITPOD_WORKSPACE_URL
            ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '3000-')
            : 'localhost',
        },
      },
    },
  },
}

export default config
