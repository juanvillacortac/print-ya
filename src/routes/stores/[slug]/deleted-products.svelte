<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc, { invalidateQuery } from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const products = await trpc(fetch).query('products:listDeleted', {
      storeSlug: params.slug,
    })
    return {
      props: {
        products,
      },
      stuff,
    }
  }
</script>

<script lang="ts">
  import { browser } from '$app/env'
  import { goto } from '$app/navigation'

  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import { squareratio } from '$lib/actions/aspectratio'
  import Preview from '$lib/components/Preview.svelte'
  import type { Store, StripedProduct } from '$lib/db'
  import { search } from '$lib/utils/search'
  import { flip } from 'svelte/animate'
  import { fly, slide } from 'svelte/transition'
  import { Redo16, View16, Warning32 } from 'carbon-icons-svelte'
  import Ufo from '$lib/components/__Ufo.svelte'
  import { expoOut } from 'svelte/easing'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  const store = $page.stuff.store as Store | null
  export let products: StripedProduct[] = []

  $: console.log(products)

  let textSearch = ''
  let categoryId = ''

  $: filteredProducts = search(products, textSearch, ['name']).filter((p) =>
    categoryId ? p.storeCategoryId === categoryId : true
  )

  $pageSubtitle = 'Deleted products'

  const restoreProduct = async (id: string) => {
    await trpc().mutation('products:upsert', {
      storeSlug: store!.slug,
      data: {
        id,
        archived: false,
      },
    })
    await invalidateQuery('products:list', 'products:listDeleted')
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Deleted products
</h2>
<div
  class="border-dashed rounded-lg flex space-x-4 bg-red-500 bg-opacity-20 border-2 border-red-500 mb-8 p-4 items-center"
>
  <Warning32 class="text-red-500" />
  <p class="m-auto text-xs">
    <span class="font-bold">Advice:</span> products listed here will be removed after
    30 days of being added.
  </p>
</div>
<div class="flex mx-auto justify-center items-center lg:w-9/10">
  <div class="flex mb-8 <sm:hidden !text-xs">
    <input
      class="bg-white border rounded-l-full border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
      type="text"
      bind:value={textSearch}
      placeholder="Enter keywords to search..."
    />
    <select
      class="bg-white border-b rounded-r-full border-l-0 border-gray-300 leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      bind:value={categoryId}
    >
      <option value="">All categories</option>
      {#each store?.categories || [] as category}
        <option value={category.id}>{category.name}</option>
      {/each}
    </select>
  </div>
</div>
{#if filteredProducts?.length}
  <div
    class="divide-y border rounded-lg flex flex-col border-gray-300 w-full relative overscroll-auto dark:divide-gray-700 dark:bg-gray-800 dark:border-gray-700 "
    in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
  >
    {#each filteredProducts as product, idx (product.id)}
      <div
        class="relative"
        transition:slide|local={{
          duration: 600,
          easing: expoOut,
        }}
      >
        <div
          class="flex p-4 text-gray-500 justify-between relative sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
          class:skeleton={!product}
          class:pointer-events-none={!product}
        >
          <div
            class="flex items-center sm:space-x-4 <lg:flex-col <lg:space-y-4"
          >
            <div
              class="rounded-lg bg-gray-100 w-full overflow-hidden pointer-events-none select-none sm:w-36  dark:bg-gray-900"
              style="aspect-ratio: 1/1"
            >
              <div class="flex h-full w-full items-center justify-center">
                {#if product.template}
                  <TemplatePreview
                    lazy
                    showFonts
                    template={product.template}
                    controls={false}
                  />
                {/if}
              </div>
            </div>
            <div
              class="flex flex-col space-y-1 w-full whitespace-normal sm:w-40"
            >
              <a
                href="products/{product?.slug}"
                class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white hover:underline"
                sveltekit:prefetch
              >
                {product.name}
              </a>
            </div>
          </div>
          <div class="flex flex-col space-y-1">
            <p class="font-bold text-xs text-black dark:text-white">Category</p>
            <button
              class="flex text-sm text-blue-500 hover:underline"
              on:click={() => (categoryId = product.storeCategory?.id || '')}
            >
              {product.storeCategory?.name}
            </button>
          </div>
          <div class="flex flex-col space-y-1">
            <p class="font-bold text-xs text-black dark:text-white">
              Base price
            </p>
            <p class="font-bold text-sm">
              ${product.price.toLocaleString('en', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div class="flex space-x-2 items-center <sm:ml-auto">
            <button
              class="border-transparent rounded flex space-x-1 border-2 p-1 text-green-500 duration-200 items-center hover:border-green-500"
              title="Delete product"
              type="button"
              on:click={() => restoreProduct(product.id)}
            >
              <div class="text-xs">Restore product</div>
              <Redo16 /></button
            >
            <a
              class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
              title="View details"
              href="products/{product.slug}"
            >
              <div class="text-xs">View product</div>
              <View16 /></a
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div
    class="flex flex-col h-full space-y-6 w-full py-8 items-center"
    in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
  >
    <div class="w-2/10">
      <Ufo class="h-auto w-full" />
    </div>
    <div class="font-bold font-title text-xl">Nothing here</div>
  </div>
{/if}
