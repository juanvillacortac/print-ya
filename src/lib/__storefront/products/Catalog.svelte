<script lang="ts">
  import { page } from '$app/stores'
  import { squareratio } from '$lib/actions/aspectratio'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import Ufo from '$lib/components/__Ufo.svelte'

  import type { StripedProduct } from '$lib/db'
  import { search as s } from '$lib/utils/search'
  import { Categories16, Category16 } from 'carbon-icons-svelte'
  import { flip } from 'svelte/animate'
  import { expoOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'

  $: store = $page.stuff.store!

  export let products: StripedProduct[] = []
  export let category: string = ''
  export let search: string = ''

  function getCategoryLink(slug: string) {
    const query = new URLSearchParams($page.url.searchParams)
    query.set('category', slug)
    return `?${query.toString()}`
  }

  $: filteredProducts = s(products, search || '', ['name']).filter((p) =>
    category ? p.storeCategory?.slug === category : true
  )
</script>

<div class="flex w-full lg:space-x-4 <lg:flex-col <lg:space-y-4">
  <div
    class="flex-col flex h-full space-y-2 w-full lg:w-2/10 lg:overflow-hidden"
  >
    <input
      class="bg-white border border-[rgb(113,3,3)] text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
      type="text"
      bind:value={search}
      placeholder="Enter keywords to search..."
    />
    <div class="flex flex-col">
      <div
        class="rounded-tl rounded-tr flex space-x-2  bg-[rgb(113,3,3)] text-white w-full p-2 items-center"
      >
        <Category16 />
        <h3 class="font-bold text-xs">Categories</h3>
      </div>
      <div
        class="border-b border-l border-r rounded-bl rounded-br flex flex-col h-full space-y-2 border-gray-300 p-2 dark:border-gray-600"
      >
        <a
          href={getCategoryLink('')}
          class="flex space-x-2 text-xs hover:underline"
        >
          <Categories16 />
          <span> All categories</span>
        </a>
        {#each store?.categories || [] as category}
          <a
            href={getCategoryLink(category.slug)}
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
  {#if filteredProducts.length}
    <div
      class="grid gap-4 grid-cols-4 lg:w-8/10"
      in:fly|local={{ y: 10, duration: 400 }}
    >
      {#each filteredProducts as p (p.id)}
        <div
          class="border rounded-lg flex flex-col space-y-2 p-2 relative dark:border-gray-600"
          animate:flip={{ duration: 400, easing: expoOut }}
          style="will-change: transform"
        >
          {#if p.template}
            <div
              class="w-full pointer-events-none aspect-square"
              use:squareratio
            >
              <TemplatePreview
                lazy
                watermark
                showFonts
                template={p.template}
                controls={false}
              />
            </div>
          {/if}
          <div class="flex flex-col space-y-1">
            <a
              href="/products/{p.slug}"
              class="font-bold text-sm hover:underline">{p.name}</a
            >
            <a
              href="/products?category={p.storeCategory?.slug}"
              class="text-xs text-blue-500 hover:underline"
              >{p.storeCategory?.name}</a
            >
            <p class="font-bold">
              ${p.price.toLocaleString('en', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      {/each}
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
