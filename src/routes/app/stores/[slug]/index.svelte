<script lang="ts">
  import { page } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store } from '$lib/db'
  import { Launch16 } from 'carbon-icons-svelte'

  $: store = $page.stuff.store as Store
</script>

<h2 class="font-bold font-title text-black mb-4 text-3xl dark:text-white">
  My Stores
</h2>
<div class="flex space-x-4 items-center">
  <div class="rounded bg-light-100 shadow p-1 dark:bg-gray-800">
    <Image
      src={store.logo}
      options={{
        q: 100,
      }}
      class="h-2rem"
    />
  </div>
  <h2 class="font-bold font-title text-black text-xl dark:text-white">
    {store.name}
  </h2>
  <a
    class="border-transparent flex hover:border-current"
    href="/app/stores/{store.slug}/preview"
    title="Go to site"
    use:tooltip
  >
    <Launch16 />
  </a>
</div>
