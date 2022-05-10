<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
  import { page } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import {
    Moon24,
    Search16,
    Sun24,
    ShoppingBag24,
    Favorite24,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store } from '$lib/db'
  import { preferences } from '$lib/stores'

  export let store: Store

  $: pageTitle =
    ($page.stuff.subtitle ? $page.stuff.subtitle + ' | ' : '') + store.name
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons favicon={store.favicon} themeColor="#000" titleName={store.name} />

<div class="top-0 left-0 text-gray-700 relative dark:text-white">
  <div
    class="bg-white border-b flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg !bg-opacity-90 dark:bg-gray-800 dark:border-gray-600"
  >
    <div class="flex mx-auto w-full p-4 justify-between items-center lg:w-7/10">
      <Image
        src={store.logo}
        class="bg-white rounded p-px h-2rem sm:h-2rem"
        options={{
          q: 100,
        }}
      />
      <div class="flex <sm:hidden !text-xs">
        <input
          class="bg-white border rounded-l-full border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
          type="text"
          placeholder="Enter keywords to search..."
        />
        <select
          class="bg-white border-b border-l-0 border-r-0 border-gray-300 leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
        >
          <option value="">All categories</option>
          {#each store.categories as category}
            <option value={category.name}>{category.name}</option>
          {/each}
        </select>
        <button
          class="rounded-r-full flex bg-blue-500 text-white p-2 pr-3 items-center"
        >
          <Search16 class="m-auto" />
        </button>
      </div>
      <div class="flex space-x-4 text-gray-400">
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-black dark:hover:text-white"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="absolute pointer-events-none">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-pink-500"
          title="Favorites"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <Favorite24 />
        </button>
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
          title="Bag"
          use:tooltip
        >
          <ShoppingBag24 />
          <p
            class="font-bold text-black text-xs text-right w-[3ch] dark:text-white"
          >
            0
          </p>
        </button>
      </div>
    </div>
    <div class="border-t w-full <lg:hidden dark:border-gray-600">
      <div
        class="flex mx-auto space-x-6 p-4 py-2 items-center justify-center uppercase lg:w-7/10"
      >
        {#each store.categories.slice(0, 4) as category}
          <a
            href={category.name}
            class="font-bold font-title text-black dark:text-white hover:text-blue-500"
            >{category.name}</a
          >
        {/each}
        {#if store.categories.length > 4}
          <a
            href="./{store.name}"
            class="font-bold font-title text-black dark:text-white hover:text-blue-500"
            >More</a
          >
        {/if}
      </div>
    </div>
  </div>

  <slot />
</div>
