<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { Launch16 } from 'carbon-icons-svelte'
  import type { Store } from '$lib/db'

  export const load: Load = async ({ params, fetch, session }) => {
    const stuff = await get<{ store: Store }>(`/api/stores/${params.slug}`, {
      fetch,
    })
    if (!stuff.store || stuff.store.userId !== session?.userId) {
      return {
        status: 404,
      }
    }

    return {
      stuff,
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { invalidate } from '$app/navigation'
  import { browser } from '$app/env'
  import { getAbsoluteURL } from '$lib/utils/host'

  let store: Store
  $: store = $page.stuff.store

  $: path = $page.url.pathname
  $: if (path && store && browser) {
    invalidate(`/api/stores/${store.slug}`)
  }
</script>

<slot />
