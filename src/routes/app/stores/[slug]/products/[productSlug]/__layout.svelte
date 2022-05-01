<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await get(
      `/api/stores/${params.slug}/products/${params.productSlug}`,
      { fetch }
    )
    if (!data)
      return {
        status: 404,
      }
    return {
      props: {
        ...data,
      },
      stuff: {
        ...stuff,
        product: data,
      },
    }
  }
</script>

<slot />
