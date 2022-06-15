<script lang="ts">
  import { pageSubtitle } from '$lib'

  import Image from '$lib/components/caravaggio/Image.svelte'
  import type { Store } from '$lib/db'

  export let stores: Store[]

  $pageSubtitle = 'Stores'
</script>

<h2 class="font-bold font-title text-black mb-6 text-3xl dark:text-white">
  My Stores
</h2>

<h2 class="font-bold font-title text-black mb-12 text-2xl dark:text-white">
  Pick a store
</h2>

<div class="mx-auto grid gap-6 grid-cols-1 lg:w-9/10 lg:grid-cols-4">
  {#each stores as store}
    <a
      class="bg-white border rounded-lg flex flex-col h-full space-y-1 border-gray-300 w-full p-4 transform transition-transform duration-200 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600 hover:scale-105"
      href="/stores/{store.slug}"
      sveltekit:prefetch
    >
      <Image
        src={store.favicon}
        options={{
          q: 100,
        }}
        class="mr-auto h-2rem"
      />
      <h4 class="font-title font-bold text-black leading-tight dark:text-white">
        {store.name}
      </h4>
    </a>
  {/each}
</div>
