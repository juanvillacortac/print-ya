<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Ufo from '$lib/components/__Ufo.svelte'
  import type { Store, StripedProduct } from '$lib/db'
  import trpc, { invalidateQuery } from '$lib/trpc/client'
  import { getBasicTemplate } from '$lib/utils/modifiers'
  import { search } from '$lib/utils/search'
  import {
    Add24,
    TrashCan16,
    TrashCan24,
    View16,
    ViewOff16,
  } from 'carbon-icons-svelte'
  import Portal from 'svelte-portal'
  import { flip } from 'svelte/animate'
  import { expoOut } from 'svelte/easing'
  import { fly, slide } from 'svelte/transition'
  const store = $page.stuff.store as Store | null
  $: products = $page.stuff.products as StripedProduct[]

  let textSearch = ''
  let categoryId = ''
  let visibility: boolean | '' = true

  $: filteredProducts = search(products, textSearch, ['name'])
    .filter((p) => (categoryId ? p.storeCategoryId === categoryId : true))
    .filter((p) =>
      typeof visibility != 'string' ? p.public == visibility : true
    )

  const setCategory = (category: string | null) => {
    categoryId = store?.categories?.find((c) => c.slug === category)?.id || ''
  }
  $: if ($page.url.searchParams.get('category')) {
    setCategory($page.url.searchParams.get('category'))
  }

  $pageSubtitle = 'Products'

  const deleteProduct = async (id: string) => {
    await trpc().mutation('products:upsert', {
      storeSlug: store!.slug,
      data: {
        id,
        archived: true,
      },
    })
    await invalidateQuery('products:list')
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products
</h2>
<Portal>
  <div class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center">
    <a
      class="rounded-full flex bg-red-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Deleted products"
      href="deleted-products"
      use:tooltip
    >
      <TrashCan24 />
    </a>
    <a
      class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Add new product"
      href="products/new"
      use:tooltip
    >
      <Add24 />
    </a>
  </div>
</Portal>
<div class="flex mx-auto justify-center items-center lg:w-9/10">
  <div class="flex mb-8 <sm:hidden !text-xs">
    <input
      class="bg-white border rounded-l-full border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
      type="text"
      bind:value={textSearch}
      placeholder="Enter keywords to search..."
    />
    <select
      class="bg-white border-b border-l-0 border-gray-300 leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      bind:value={visibility}
    >
      <option value="">Published and hidden</option>
      <option value={true}>Published</option>
      <option value={false}>Hidden</option>
    </select>
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
                {#if product.type.startsWith('template')}
                  <TemplatePreview
                    lazy
                    showFonts
                    template={product.type === 'template'
                      ? getBasicTemplate(product)
                      : product.template}
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
            <p class="font-bold text-xs text-black dark:text-white">
              Visibility
            </p>
            <div
              class="flex space-x-2 items-center"
              class:text-red-500={!product.public}
            >
              <p class="font-bold text-sm">
                {product.public ? 'Published' : 'Unpublished'}
              </p>
              {#if product.public}
                <View16 />
              {:else}
                <ViewOff16 />
              {/if}
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
              class="border-transparent rounded flex space-x-1 border-2 p-1 text-red-500 duration-200 items-center hover:border-red-500"
              title="Delete product"
              type="button"
              on:click={() => deleteProduct(product.id)}
            >
              <div class="text-xs">Send to trash</div>
              <TrashCan16 /></button
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
          <!-- <div class="flex space-x-2 items-center <sm:ml-auto">
                    <button
                      class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                      title="View details"
                      type="button"
                      on:click={() => {
                        details = {
                          key: '',
                          modifiers: item.modifiers,
                          productSlug: p?.slug || '',
                          quantity: item.quantity,
                          cost: item.basePrice,
                        }
                      }}
                    >
                      <div class="text-xs">View details</div>
                      <View16 /></button
                    >
                  </div> -->
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
