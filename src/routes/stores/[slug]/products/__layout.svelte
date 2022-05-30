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

<slot />
