<script lang="ts">
  import { layoutData, watchMedia } from '$lib'
  import type {
    OrderFee,
    ShopifyImport,
    ShopifyImportStatus,
    StrippedOrder,
  } from '@shackcart/db'
  import trpc from '$lib/trpc/client'
  import { tooltip } from '$lib/components/tooltip'
  import { onMount, tick } from 'svelte'
  import {
    Checkmark16,
    ChevronDown16,
    ChevronLeft24,
    ChevronRight24,
    ChevronSort16,
    ChevronUp16,
    Hourglass16,
    Launch16,
    WarningAlt16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/environment'
  import Submenu from '$lib/components/Submenu.svelte'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Ufo from '$lib/components/__Ufo.svelte'
  import type { InferQueryInput, InferQueryOutput } from '@shackcart/trpc'
  import { clamp } from '$lib/utils/math'

  export let items: InferQueryOutput<'shopify:list'>['imports'] | undefined =
    undefined
  export let load = true
  export let total: number | undefined = undefined

  let pageNumber = 1
  $: pages = Math.ceil((total || 1) / 20)

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let searchId = ''

  onMount(() => {
    const interval = setInterval(() => search(), 5000)
    return () => {
      clearInterval(interval)
    }
  })

  export const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        items = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('shopify:list', {
        storeId: $layoutData.store!.id,
        filter: {
          ...filter,
          id: searchId,
        },
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
        page: pageNumber,
      })
      clearTimeout(waitTimeout)
      items = filtered.imports
      total = filtered.count
      wait = true
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

  const filters: Record<ShopifyImportStatus | 'all', typeof filter> = {
    all: {},
    failed: {
      status: ['failed'],
    },
    processing: {
      status: ['processing'],
    },
    imported: {
      status: ['imported'],
    },
    in_review: {
      status: ['in_review'],
    },
    pending: {
      status: ['pending'],
    },
  }

  const sorters: Record<
    Exclude<
      keyof NonNullable<InferQueryInput<'shopify:list'>['orderBy']>,
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
  }

  let filter: NonNullable<InferQueryInput<'shopify:list'>['filter']> =
    filters.all
  let sortBy: {
    prop: keyof NonNullable<InferQueryInput<'shopify:list'>['orderBy']>
    sort: 'asc' | 'desc'
  } = sorters.createdAt.desc

  $: if (browser && sortBy) {
    wait = false
  }

  const resetPagination = () => {
    pageNumber = 1
  }

  $: if (searchId || !searchId || sortBy || filter) {
    resetPagination()
  }

  $: if (browser && load) {
    search(filter, sortBy, searchId, pageNumber)
  }

  const mediaqueries = {
    small: '(max-width: 849px)',
    large: '(min-width: 850px)',
    short: '(max-height: 399px)',
    landscape: '(orientation: landscape) and (max-height: 499px)',
    tiny: '(orientation: portrait) and (max-height: 599px)',
    dark: '(prefers-color-scheme: dark)',
    noanimations: '(prefers-reduced-motion: reduce)',
  }

  const media = watchMedia(mediaqueries)
</script>

<div
  class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
>
  <div
    class="flex flex-wrap text-sm w-full text-gray-500 gap-4 items-center !font-bold"
  >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.all}
      class:dark:border-white={filter == filters.all}
      class:text-gray-800={filter == filters.all}
      class:dark:text-white={filter == filters.all}
      on:click={() => {
        wait = false
        filter = filters.all
      }}>All</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.pending}
      class:dark:border-white={filter == filters.pending}
      class:text-gray-800={filter == filters.pending}
      class:dark:text-white={filter == filters.pending}
      on:click={() => {
        wait = false
        filter = filters.pending
      }}>Pending</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.processing}
      class:dark:border-white={filter == filters.processing}
      class:text-gray-800={filter == filters.processing}
      class:dark:text-white={filter == filters.processing}
      on:click={() => {
        wait = false
        filter = filters.processing
      }}>Processing</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.imported}
      class:dark:border-white={filter == filters.imported}
      class:text-gray-800={filter == filters.imported}
      class:dark:text-white={filter == filters.imported}
      on:click={() => {
        wait = false
        filter = filters.imported
      }}>Imported</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.failed}
      class:dark:border-white={filter == filters.failed}
      class:text-gray-800={filter == filters.failed}
      class:dark:text-white={filter == filters.failed}
      on:click={() => {
        wait = false
        filter = filters.failed
      }}>Failed</button
    >
  </div>
  <div class="flex space-x-2 w-full justify-between items-center">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      type="search"
      bind:value={searchId}
      placeholder="Search by import id"
    />
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
        <div class="flex flex-col space-y-3">
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
  {#if items && !items.length}
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
    >
      {#if !items}
        <div class="h-64vh w-full skeleton" />
      {:else if $media.small}
        <div
          class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
        >
          {#each items as i, idx}{/each}
        </div>
      {:else}
        <table
          class="text-sm text-left w-full text-gray-500 relative overflow-auto dark:text-gray-400"
        >
          <thead
            class="bg-gray-50 text-xs top-0 text-gray-700 z-20 uppercase sticky dark:bg-gray-700 dark:text-gray-400"
          >
            <tr>
              <th scope="col" class="py-3 px-6"> Import Id </th>
              <th scope="col" class="py-3 px-6"> Creation date </th>
              <th scope="col" class="text-right py-3 px-6"> Status </th>
            </tr>
          </thead>
          <tbody>
            {#each items as i, idx}
              <tr
                class="bg-white dark:bg-gray-800"
                class:border-b={idx !== items.length - 1}
                class:dark:border-gray-700={idx !== items.length - 1}
              >
                <th
                  scope="row"
                  class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
                >
                  <div class="flex w-12ch">
                    <p
                      class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible "
                      title="Copy to clipboard"
                      on:click={() => navigator.clipboard.writeText(i.id)}
                      use:tooltip
                    >
                      {i.id}
                    </p>
                  </div>
                </th>
                <td>
                  <div class="flex py-4 px-6">
                    <p class="font-bold text-xs">
                      {i.createdAt.toLocaleString()}
                    </p>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex justify-end">
                    {#if i.status === 'failed'}
                      <div
                        class="rounded flex font-bold space-x-1 bg-red-600 shadow text-xs p-1 text-gray-100 items-center"
                      >
                        <WarningAlt16 />
                        <span> Import failed </span>
                      </div>
                    {:else if i.status === 'imported'}
                      <div
                        class="rounded flex font-bold space-x-1 bg-green-600 shadow text-xs p-1 text-gray-100 items-center"
                      >
                        <Checkmark16 />
                        <span> Imported </span>
                      </div>
                    {:else if i.status === 'processing'}
                      <div
                        class="rounded flex font-bold space-x-1 bg-blue-600 shadow text-xs p-1 text-gray-100 items-center"
                      >
                        <Hourglass16
                          class="roll !animate-loop !animate-duration-1500"
                        />
                        <span> Processing... </span>
                      </div>
                    {:else if i.status === 'pending'}
                      <a
                        class="rounded flex font-bold space-x-1 bg-purple-600 shadow text-xs p-1 text-gray-100 items-center hover:underline"
                        href="import/{i.id}"
                        data-sveltekit-prefetch
                      >
                        <span>
                          Review {i.products} products
                        </span>
                        <Launch16 />
                      </a>
                    {/if}
                  </div>
                </td>
                <td /></tr
              >
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div class="flex w-full items-center justify-between">
      <span class="font-bold text-xs leading-0">
        {total || 0} imports found
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

<style>
  @-webkit-keyframes global-roll {
    0% {
      transform: rotate3d(0, 0, 1, -180deg);
    }
    50% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate3d(0, 0, 1, 180deg);
    }
  }
  :global(.roll) {
    -webkit-animation: global-roll;
    animation: global-roll;
  }
</style>
