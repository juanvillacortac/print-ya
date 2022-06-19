<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { Product } from '$lib/db'
  import trpc from '$lib/trpc'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await trpc(fetch).query('products:getBySlug', {
      productSlug: params.productSlug,
      storeSlug: params.slug,
    })
    // const data = await get<Product>(
    //   `/api/stores/${params.slug}/products/${params.productSlug}`,
    //   { fetch }
    // )
    if (!data)
      return {
        status: 404,
      }
    return {
      stuff: {
        ...stuff,
        product: data,
      },
    }
  }
</script>

<slot />
