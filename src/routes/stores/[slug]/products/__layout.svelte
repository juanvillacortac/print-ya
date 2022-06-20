<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await trpc(fetch).query('products:list', {
      storeSlug: params.slug,
    })
    return {
      stuff: {
        ...stuff,
        products: data,
      },
    }
  }
</script>

<slot />
