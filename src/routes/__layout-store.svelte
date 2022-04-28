<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'

  export const load: Load = async ({ params, fetch }) => {
    const data = await get(`/api/stores/${params.slug}`, { fetch })
    if (!data.store)
      return {
        status: 404,
      }
    return {
      props: {
        ...data,
      },
      stuff: {
        ...data,
      },
    }
  }
</script>

<script>
  import StoreLayout from '$lib/__layouts/StoreLayout.svelte'

  export let store
</script>

<StoreLayout {store}>
  <slot />
</StoreLayout>
