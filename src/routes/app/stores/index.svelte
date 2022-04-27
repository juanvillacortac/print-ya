<script lang="ts">
  import Image from '$lib/components/caravaggio/Image.svelte'
  import type { Store } from '$lib/db'

  export let stores: Store[]
</script>

<h2 class="font-bold font-title text-black mb-6 text-3xl dark:text-white">
  My Stores
</h2>

<div class="grid gap-6 grid-cols-1 lg:grid-cols-4">
  {#each stores as store}
    <a
      class="bg-white rounded-xl flex flex-col h-full space-y-2 shadow w-full p-4 transform duration-400 relative overflow-hidden dark:bg-gray-800 hover:scale-95"
      href="/app/stores/{store.slug}"
    >
      <Image
        src={store.logo}
        options={{
          q: 100,
        }}
        class="mr-auto h-2rem"
      />
      <h4 class="font-title font-bold text-black">{store.name}</h4>
    </a>
  {/each}
</div>
