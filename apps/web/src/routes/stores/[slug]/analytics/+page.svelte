<script lang="ts">
  import { layoutData } from '$lib'
  import { Search32 } from 'carbon-icons-svelte'

  $: actions = [
    {
      icon: Search32,
      title: 'Search history',
      href: `/stores/${$layoutData.store!.slug}/analytics/search-history`,
    },
  ]
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Analytics
  </h3>

  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
    {#each actions as a}
      <a
        class="bg-white border rounded-lg flex flex-col h-full space-y-2 border-gray-300 w-full p-4 transform transition-transform duration-200 relative overflow-hidden items-center dark:bg-gray-800 dark:border-gray-600 hover:scale-105"
        href={a.href}
        style="will-change: transform"
      >
        <svelte:component this={a.icon} />
        <h4 class="font-title font-bold text-black dark:text-white">
          {a.title}
        </h4>
      </a>
    {/each}
  </div>
</div>
