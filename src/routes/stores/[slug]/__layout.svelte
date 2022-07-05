<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ params, fetch, session }) => {
    const store = await client(fetch).query('stores:getBySlug', params.slug)
    if (!store || store.userId !== session?.userId) {
      return {
        status: 404,
      }
    }

    return {
      stuff: {
        store,
      },
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { browser } from '$app/env'
  import client, { invalidateQuery } from '$lib/trpc/client'

  $: if ($page.url && browser) {
    invalidateQuery('stores:getBySlug')
  }
</script>

<slot />
