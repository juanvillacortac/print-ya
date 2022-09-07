<script lang="ts">
  import trpc from '$lib/trpc/client'
  import { tick } from 'svelte'
  import {
    Checkmark16,
    ChevronDown16,
    ChevronLeft24,
    ChevronRight24,
    ChevronSort16,
    ChevronUp16,
    Redo16,
    TrashCan16,
    View16,
    ViewOff16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/environment'
  import Submenu from '$lib/components/Submenu.svelte'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Ufo from '$lib/components/__Ufo.svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { layoutData } from '$lib/stores'
  import { getBasicTemplate } from '@shackcart/db/dist/utils'
  import type { InferQueryInput, InferQueryOutput } from '@shackcart/trpc'
  import { tooltip } from '$lib/components/tooltip'
  import { clamp } from '$lib/utils/math'

  export let archived = false
  export let importId: string | undefined = undefined
  export let products:
    | InferQueryOutput<'products:list'>['products']
    | undefined = undefined
  export let total: number | undefined = undefined

  let pageNumber = 1
  $: pages = Math.ceil((total || 1) / 20)

  let frame: HTMLDivElement | undefined

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let nameSearch = ''
  let categoryId = ''
  let visible: boolean | '' = ''
  const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        products = undefined
        total = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('products:list', {
        storeSlug: $layoutData.store!.slug,
        filter: {
          name: nameSearch || undefined,
          categoryId: categoryId || undefined,
          public: visible || undefined,
          shopifyImportId: importId || undefined,
          archived,
        },
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
        page: pageNumber,
      })
      clearTimeout(waitTimeout)
      products = filtered.products
      total = filtered.count
      wait = true
      if (frame) frame.scrollTop = 0
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    if (wait) {
      timeout = setTimeout(() => find(), 500)
    } else {
      find()
    }
  }

  let wait = true

  const sorters: Record<
    Exclude<
      keyof NonNullable<InferQueryInput<'products:list'>['orderBy']>,
      'id'
    >,
    {
      asc: typeof sortBy
      desc: typeof sortBy
    }
  > = {
    createdAt: {
      asc: {
        prop: 'createdAt',
        sort: 'asc',
      },
      desc: {
        prop: 'createdAt',
        sort: 'desc',
      },
    },
    name: {
      asc: {
        prop: 'name',
        sort: 'asc',
      },
      desc: {
        prop: 'name',
        sort: 'desc',
      },
    },
    price: {
      asc: {
        prop: 'price',
        sort: 'asc',
      },
      desc: {
        prop: 'price',
        sort: 'desc',
      },
    },
  }

  let sortBy: {
    prop: keyof NonNullable<InferQueryInput<'products:list'>['orderBy']>
    sort: 'asc' | 'desc'
  } = sorters.createdAt.desc

  $: if (browser && sortBy) {
    wait = false
  }

  const resetPagination = () => {
    pageNumber = 1
  }

  $: if (nameSearch || !nameSearch || sortBy || categoryId || !categoryId) {
    resetPagination()
  }

  $: if (browser) {
    search(nameSearch, visible, categoryId, sortBy, pageNumber)
  }

  const reviewProduct = async (id: string) => {
    await trpc().mutation('shopify:reviewProduct', id)
    search()
  }

  const deleteProduct = async (id: string) => {
    const archived = !products?.find((p) => p.id === id)?.archived
    await trpc().mutation('products:upsert', {
      storeSlug: $layoutData.store!.slug,
      data: {
        id,
        archived,
      },
    })
    search()
  }
</script>

<div
  class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
>
  <div class="flex space-x-2 w-full justify-between items-center">
    <div class="flex w-full items-center <lg:flex-col">
      <input
        class="bg-white border-t  border-b border-l rounded-tl border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:rounded-bl lg:w-6/10 <lg:rounded-tr !lg:border-r-0 !<lg:border-b-0 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
        type="search"
        bind:value={nameSearch}
        placeholder="Search by name or by tag"
      />
      <div class="flex w-full lg:w-4/10">
        <select
          class="bg-white border-t border-b border-gray-300 text-xs leading-tight py-2 px-3 w-1/2 appearance-none !border-r-0 <lg:rounded-bl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
          bind:value={visible}
        >
          <option value="">Published and hidden</option>
          <option value={true}>Published</option>
          <option value={false}>Hidden</option>
        </select>
        <select
          class="bg-white border-t border-b rounded-br border-gray-300 text-xs leading-tight py-2 px-3 w-1/2 appearance-none lg:rounded-tr dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
          bind:value={categoryId}
        >
          <option value="">All categories</option>
          {#each $layoutData.store?.categories || [] as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div
      class="flex items-end lg:space-x-2 lg:items-center <lg:flex-col-reverse"
    >
      <Submenu>
        <button
          class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 whitespace-nowrap items-center hover:border-gray-300 dark:hover:border-gray-500"
          type="button"
          slot="button"
        >
          <div class="text-xs">Sort by</div>
          <ChevronSort16 /></button
        >
        <div
          class="flex flex-col font-bold divide-y-1 divide-gray-300 text-xs text-gray-80 dark:divide-gray-600 dark:text-white"
          slot="body"
        >
          <div class="flex flex-col space-y-3 pb-3">
            <p class="font-bold">Product name</p>
            <label class="flex font-normal space-x-2 text-xs">
              <input
                type="radio"
                value={sorters.name.asc}
                bind:group={sortBy}
              />
              <div class="flex space-x-1 items-center">
                <ChevronUp16 />
                <span>Ascending</span>
              </div>
            </label>
            <label class="flex font-normal space-x-2 text-xs">
              <input
                type="radio"
                value={sorters.name.desc}
                bind:group={sortBy}
                checked
              />
              <div class="flex space-x-1 items-center">
                <ChevronDown16 />
                <span>Descending</span>
              </div>
            </label>
          </div>

          <div class="flex flex-col space-y-3 pt-3">
            <p class="font-bold">Creation date</p>
            <label class="flex font-normal space-x-2 text-xs">
              <input
                type="radio"
                value={sorters.createdAt.asc}
                bind:group={sortBy}
              />
              <div class="flex space-x-1 items-center">
                <ChevronUp16 />
                <span>Ascending</span>
              </div>
            </label>
            <label class="flex font-normal space-x-2 text-xs">
              <input
                type="radio"
                value={sorters.createdAt.desc}
                bind:group={sortBy}
                checked
              />
              <div class="flex space-x-1 items-center">
                <ChevronDown16 />
                <span>Descending</span>
              </div>
            </label>
          </div>
        </div>
      </Submenu>
    </div>
  </div>
  {#if products && !products.length}
    <div
      class="flex flex-col h-full mx-auto space-y-6 w-full py-8 items-center lg:w-8/10"
      in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="w-5/10 lg:w-2/10">
        <Ufo class="h-auto w-full" />
      </div>
      <div class="font-bold font-title text-xl">Nothing here</div>
    </div>
  {:else}
    <div
      class="bg-white border rounded-lg flex border-gray-300 w-full max-h-65vh relative overflow-auto dark:bg-gray-800 dark:border-gray-700"
      bind:this={frame}
    >
      {#if !products}
        <div class="h-64vh w-full skeleton" />
      {:else}
        <div
          class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
        >
          {#each products as product, idx}
            <div class="relative">
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
                      data-sveltekit-prefetch
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
                <!-- <div class="flex flex-col space-y-1">
                  <p class="font-bold text-xs text-black dark:text-white">
                    Category
                  </p>
                  {#if product.storeCategory}
                    <button class="flex text-sm text-blue-500 hover:underline">
                      {product.storeCategory?.name}
                    </button>
                  {:else}
                    <div class="">N/A</div>
                  {/if}
                </div> -->
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
                  {#if product.shopifyImportId}
                    <button
                      class="border-transparent rounded flex space-x-1 border-2 p-1 text-green-500 duration-200 items-center hover:border-green-500"
                      type="button"
                      on:click={() => reviewProduct(product.id)}
                    >
                      <div class="text-xs">Approve product</div>
                      <Checkmark16 /></button
                    >
                  {:else if !product.archived}
                    <button
                      class="border-transparent rounded flex space-x-1 border-2 p-1 text-red-500 duration-200 items-center hover:border-red-500"
                      type="button"
                      on:click={() => deleteProduct(product.id)}
                    >
                      <div class="text-xs">Send to trash</div>
                      <TrashCan16 /></button
                    >
                  {:else}
                    <button
                      class="border-transparent rounded flex space-x-1 border-2 p-1 text-green-500 duration-200 items-center hover:border-green-500"
                      type="button"
                      on:click={() => deleteProduct(product.id)}
                    >
                      <div class="text-xs">Restore product</div>
                      <Redo16 /></button
                    >
                  {/if}
                  <a
                    class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                    href="/stores/{$layoutData.store
                      ?.slug}/products/{product.slug}"
                  >
                    <div class="text-xs">View product</div>
                    <View16 /></a
                  >
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex w-full items-center justify-between">
      <span class="font-bold text-xs leading-0">
        {total || 0} products found
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
  {/if}
</div>
