<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
  import { navigating, page } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import {
    Moon24,
    Search16,
    Sun24,
    ShoppingBag24,
    Favorite24,
    UserAvatar24,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store } from '$lib/db'
  import { bag, pageSubtitle, preferences } from '$lib/stores'

  export let store: Store

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  $: if (!$navigating) {
    $pageSubtitle = ''
  }

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + store.name
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons favicon={store.favicon} themeColor="#000" titleName={store.name} />

<div class="top-0 left-0 text-gray-700 relative dark:text-white">
  <div
    class="bg-white flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg !bg-opacity-90 dark:bg-gray-800 dark:border-gray-600"
  >
    <div
      class="flex mx-auto w-full p-4 py-2 justify-between items-center lg:w-9/10"
    >
      <div class="flex space-x-4 items-center">
        <a href="/" class="flex">
          <Image
            src={store.logo}
            class="rounded-sm p-px h-2rem lg:h-3rem dark:bg-white dark:bg-opacity-20"
            options={{
              o: 'png',
              rs: {
                s: 'x48',
                m: 'scale',
              },
            }}
          />
        </a>
        <div class="flex py-2 <sm:hidden !text-xs">
          <input
            class="bg-white border border-[rgb(113,3,3)]  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
            type="text"
            placeholder="Enter keywords to search..."
          />
          <select
            class="bg-white border-b border-l-0 border-r-0 border-[rgb(113,3,3)]  leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          >
            <option value="">All categories</option>
            {#each store.categories as category}
              <option value={category.name}>{category.name}</option>
            {/each}
          </select>
          <button class="flex bg-[rgb(113,3,3)]  text-white p-2 items-center">
            <Search16 class="m-auto" />
          </button>
        </div>
      </div>
      <div class="flex space-x-2 text-gray-400 items-center lg:space-x-4">
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-black dark:hover:text-white"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="top-0 left-0 absolute pointer-events-none">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
        <a
          class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
          title="Log in"
          href="/login"
          use:tooltip
        >
          <UserAvatar24 />
        </a>
        <button
          class="flex relative hover:text-pink-500"
          title="Favorites"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <Favorite24 />
        </button>
        <a
          class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
          title="Shopping Cart"
          href="/cart"
          use:tooltip
        >
          <ShoppingBag24 />
          <p class="font-bold text-xs text-right w-[3ch] <lg:hidden">
            {$bag.length || 0}
          </p>
        </a>
      </div>
    </div>
    <div class="bg-[rgb(113,3,3)] text-white text-base w-full <lg:hidden">
      <div class="flex mx-auto space-x-4 text-white p-4 py-2 lg:w-9/10">
        <a href="./{store.name}">Home</a>
        {#each store.categories.slice(0, 8) as category}
          <a href={category.name}>{category.name}</a>
        {/each}
        <a href="/faq">FAQ</a>
      </div>
    </div>
  </div>

  <slot />
</div>
