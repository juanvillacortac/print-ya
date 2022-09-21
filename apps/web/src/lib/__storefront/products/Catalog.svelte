<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { squareratio } from '$lib/actions/aspectratio'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Ufo from '$lib/components/__Ufo.svelte'

  import type { StripedProduct } from '@shackcart/db'
  import { favorites, layoutData } from '$lib/stores'
  import {
    Categories16,
    Category16,
    ChevronLeft24,
    ChevronRight24,
    Favorite24,
    FavoriteFilled24,
    Search16,
  } from 'carbon-icons-svelte'
  import { createEventDispatcher } from 'svelte'
  import { expoOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'
  import { getBasicTemplate } from '@shackcart/db/dist/utils'
  import { clamp } from '$lib/utils/math'

  const dispatch = createEventDispatcher<{ search: string }>()

  $: store = $layoutData.store!

  export let products: StripedProduct[]
  export let count: number
  let searchTerm = ''

  let pageNumber: number
  export { pageNumber as page }

  $: pages = Math.ceil(count / 20)

  function getPageLink(pageNumber: number) {
    const query = new URLSearchParams($page.url.searchParams)
    query.set('page', String(pageNumber))
    return `?${query.toString()}`
  }

  function getCategoryLink(slug: string) {
    const query = new URLSearchParams($page.url.searchParams)
    if (slug) {
      query.set('category', slug)
    } else {
      query.delete('category')
    }
    return `?${query.toString()}`
  }
</script>

<div class="flex w-full lg:space-x-4 <lg:flex-col <lg:space-y-4">
  <div
    class="flex-col flex h-full space-y-2 w-full lg:w-2/10 lg:overflow-hidden"
  >
    <form
      on:submit|preventDefault|stopPropagation={() => {
        dispatch('search', searchTerm)
      }}
      class="flex w-full"
    >
      <input
        class="bg-white border border-$sc-color-primary text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
        type="search"
        bind:value={searchTerm}
        placeholder="Enter keywords to search..."
      />
      <button class="bg-$sc-color-primary flex  text-white p-2 items-center">
        <Search16 class="m-auto" />
      </button>
    </form>
    <div class="flex flex-col">
      <div
        class="bg-$sc-color-primary rounded-tl rounded-tr flex  space-x-2 text-white w-full p-2 items-center"
      >
        <Category16 />
        <h3 class="font-bold text-xs">Collections</h3>
      </div>
      <div
        class="border-b border-l border-r rounded-bl rounded-br flex flex-col h-full space-y-2 border-gray-300 p-2 dark:border-gray-600"
      >
        <a
          href={getCategoryLink('')}
          data-sveltekit-noscroll
          class="flex space-x-2 text-xs hover:underline"
        >
          <Categories16 />
          <span> All products</span>
        </a>
        {#each store?.categories || [] as category}
          <a
            href={getCategoryLink(category.name)}
            data-sveltekit-noscroll
            class="flex space-x-2 text-xs hover:underline"
          >
            <Categories16 />
            <span>
              {category.name}
            </span>
          </a>
        {/each}
      </div>
    </div>
  </div>
  {#if products?.length}
    <div class="flex flex-col space-y-2 lg:w-8/10">
      <div class="flex h-33px w-full items-center justify-between">
        <span class="font-bold text-xs leading-0">
          {count} products found
        </span>
        <div class="flex space-x-2 items-center">
          <button
            title="Previous page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({ min: 1, max: pages, val: pageNumber - 1 })
            }}
          >
            <ChevronLeft24 />
          </button>
          <div
            class="flex font-bold space-x-2 text-xs text-gray-400 uppercase items-center"
          >
            <select
              bind:value={pageNumber}
              class="bg-transparent font-bold py-1 appearance-none !border-none !outline-none"
            >
              {#each Array.from({ length: pages })
                .fill({})
                .map((_, idx) => idx + 1) as n}
                <option value={n}>{n}</option>
              {/each}
            </select>
            <span>/</span>
            <p>{pages}</p>
          </div>
          <button
            title="Next page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({ min: 1, max: pages, val: pageNumber + 1 })
            }}
          >
            <ChevronRight24 />
          </button>
        </div>
      </div>
      <div
        class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        in:fly|local={{ y: 10, duration: 400 }}
      >
        {#each products as p (p.id)}
          <div
            class="bg-white border rounded-lg cursor-pointer flex flex-col space-y-2 border-gray-300 w-full p-2 transform transition-all relative dark:bg-gray-800 dark:border-gray-600 hover:shadow-lg hover:scale-102"
            style="will-change: transform"
            on:click={() => goto(`/products/${p.slug}`)}
          >
            {#if p.type.startsWith('template')}
              <div
                class="flex w-full pointer-events-none aspect-square"
                use:squareratio
              >
                <TemplatePreview
                  lazy
                  watermark
                  showFonts
                  template={p.type === 'template'
                    ? getBasicTemplate(p)
                    : p.template}
                  controls={false}
                />
              </div>
            {/if}
            <div
              class="flex flex-col flex-grow h-full space-y-1 justify-between"
            >
              <div class="flex flex-col space-y-1">
                <a
                  href="/products/{p.slug}"
                  class="font-bold text-sm <sm:text-xl hover:underline"
                  >{p.name}</a
                >
                <div class="flex flex-wrap -m-1">
                  {#each p.categories || [] as category}
                    <a
                      href="/products?category={encodeURI(category.name)}"
                      class="rounded bg-gray-200 m-1 text-xs leading-none max-w-14ch p-1 transform duration-200 overflow-hidden whitespace-nowrap overflow-ellipsis dark:bg-gray-600 hover:scale-102 hover:underline"
                      >{category.name}</a
                    >
                  {/each}
                </div>
              </div>
              <div class="flex w-full justify-between items-end">
                <p class="font-bold self-end">
                  ${p.price.toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {#if $favorites.existInFavorites(p.id)}
                  <button
                    class="flex text-pink-500 relative hover:text-pink-400"
                    title="Remove from favorites"
                    on:click|preventDefault|stopPropagation={() =>
                      favorites.delete(p.id)}
                    use:tooltip
                  >
                    <FavoriteFilled24 />
                  </button>
                {:else}
                  <button
                    class="flex text-gray-400 relative hover:text-pink-500"
                    title="Add to favorites"
                    on:click|preventDefault|stopPropagation={() =>
                      favorites.addToFavorites(p.id)}
                    use:tooltip
                  >
                    <Favorite24 />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
      <div class="flex h-33px w-full items-center justify-between">
        <span class="font-bold text-xs leading-0">
          {count} products found
        </span>
        <div class="flex space-x-2 items-center">
          <button
            title="Previous page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({ min: 1, max: pages, val: pageNumber - 1 })
            }}
          >
            <ChevronLeft24 />
          </button>
          <div
            class="flex font-bold space-x-2 text-xs text-gray-400 uppercase items-center"
          >
            <select
              bind:value={pageNumber}
              class="bg-transparent font-bold py-1 appearance-none !border-none !outline-none"
            >
              {#each Array.from({ length: pages })
                .fill({})
                .map((_, idx) => idx + 1) as n}
                <option value={n}>{n}</option>
              {/each}
            </select>
            <span>/</span>
            <p>{pages}</p>
          </div>
          <button
            title="Next page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({ min: 1, max: pages, val: pageNumber + 1 })
            }}
          >
            <ChevronRight24 />
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div
      class="flex flex-col h-full space-y-6 w-full py-8 items-center lg:w-8/10"
      in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="w-2/10">
        <Ufo class="h-auto w-full" />
      </div>
      <div class="font-bold font-title text-xl">Nothing here</div>
    </div>
  {/if}
</div>
