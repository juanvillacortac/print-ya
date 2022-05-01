<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import Image from '$lib/components/caravaggio/Image.svelte'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await get(`/api/stores/${params.slug}/products`, { fetch })
    return {
      props: {
        ...stuff,
        ...data,
      },
      stuff: {
        ...stuff,
        products: data,
      },
    }
  }
</script>

<script>
  import { tooltip } from '$lib/components/tooltip'
  import { Launch16 } from 'carbon-icons-svelte'
  export let store
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products
</h2>
<div class="flex space-x-4 mb-6 items-center" />
<slot />
