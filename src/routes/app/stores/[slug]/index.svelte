<script lang="ts">
  import { page } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store } from '$lib/db'
  import {
    Category32,
    Code32,
    ColorPalette32,
    Launch16,
  } from 'carbon-icons-svelte'

  $: store = $page.stuff.store as Store

  $: actions = [
    {
      icon: Category32,
      title: 'Categories',
      href: `/app/stores/${store.slug}/categories`,
    },
    {
      icon: Code32,
      title: 'Templates',
      href: `/app/stores/${store.slug}/templates`,
    },
    {
      icon: ColorPalette32,
      title: 'Customize storefront',
      href: `/app/stores/${store.slug}/customization`,
    },
  ]
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Actions
  </h3>

  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
    {#each actions as a}
      <a
        class="bg-white rounded-xl flex flex-col h-full space-y-2 shadow w-full p-4 transform duration-400 relative overflow-hidden items-center dark:bg-gray-800 hover:scale-95"
        href={a.href}
      >
        <svelte:component this={a.icon} />
        <h4 class="font-title font-bold text-black dark:text-white">
          {a.title}
        </h4>
      </a>
    {/each}
  </div>
</div>
