<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { StripedProduct } from '$lib/db/products'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await get<StripedProduct[]>(
      `/api/stores/${params.slug}/products`,
      { fetch }
    )
    return {
      stuff: {
        ...stuff,
        products: data,
      },
    }
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products
</h2>
<div class="flex space-x-4 mb-6 items-center" />
<slot />
