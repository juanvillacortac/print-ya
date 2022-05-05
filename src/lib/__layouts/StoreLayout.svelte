<script lang="ts">
  import 'virtual:windi.css'
  import '$lib/styles/base.css'

  import Favicons from '$lib/components/Favicons.svelte'
  import { preferences } from '$lib'
  import { browser } from '$app/env'
  import Toast from '$lib/components/Toast.svelte'
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

  export let store: Store

  $: if (browser)
    document.documentElement.classList.toggle('dark', $preferences.darkMode)

  const fontsURL =
    'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,900;1,700&family=Square+Peg&family=Roboto:wght@300;400;500;700;900&display=swap'

  const fontsTag = `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="${fontsURL}""
    rel="stylesheet"
    media="print"
    onload="this.onload=null; this.removeAttribute('media');"
  />
  <noscript>
    <link rel="stylesheet" href=${fontsURL} />
  </noscript>`

  $: pageTitle =
    ($page.stuff.subtitle ? $page.stuff.subtitle + ' | ' : '') + store.name
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

<Favicons favicon={store.favicon} themeColor="#000" titleName={store.name} />

<div
  class=" bg-white top-0 left-0  text-gray-700 relative dark:bg-gray-800 dark:text-white"
>
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
<Toast />

<style>
  :global(html) {
    --windi-bg: white;
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: #e5e7eb;
  }
  :global(html.dark) {
    --windi-bg: rgb(31, 41, 55);
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: rgb(75, 85, 99);
  }
</style>
