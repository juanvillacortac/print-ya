<script lang="ts">
  import { page } from '$app/stores'
  import { browser } from '$app/env'
  import { invalidateQuery } from '$lib/trpc/client'

  $: if ($page.url && browser) {
    invalidateQuery('stores:getBySlug')
  }
</script>

<slot />
