<script lang="ts">
  import { page } from '$app/stores'
  import trpc, {
    type InferQueryInput,
    type InferQueryOutput,
  } from '$lib/trpc/client'
  import { tick } from 'svelte'
  import {
    ChevronDown16,
    ChevronLeft24,
    ChevronRight24,
    ChevronSort16,
    ChevronUp16,
    Launch16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import Submenu from '$lib/components/Submenu.svelte'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Ufo from '$lib/components/__Ufo.svelte'
  import { layoutData, watchMedia } from '$lib/stores'
  import { tooltip } from '$lib/components/tooltip'
  import { clamp } from '$lib/utils/math'

  export let entries:
    | InferQueryOutput<'analytics:searchHistory:list'>['entries']
    | undefined = undefined
  export let total: number | undefined = undefined

  let pageNumber = 1
  $: pages = Math.ceil((total || 1) / 20)

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let nameSearch = ''
  let categorySlug = ''
  const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        entries = undefined
        total = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('analytics:searchHistory:list', {
        storeId: $layoutData.store!.id,
        filter: {
          searchTerm: nameSearch,
          categorySlug,
        },
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
        page: pageNumber,
      })
      clearTimeout(waitTimeout)
      entries = filtered.entries
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

  const sorters: Record<
    Exclude<
      keyof NonNullable<
        InferQueryInput<'analytics:searchHistory:list'>['orderBy']
      >,
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
    searchTerm: {
      asc: {
        prop: 'searchTerm',
        sort: 'asc',
      },
      desc: {
        prop: 'searchTerm',
        sort: 'desc',
      },
    },
  }

  let sortBy: {
    prop: keyof NonNullable<
      InferQueryInput<'analytics:searchHistory:list'>['orderBy']
    >
    sort: 'asc' | 'desc'
  } = sorters.createdAt.desc

  $: if (browser && sortBy) {
    wait = false
  }

  const resetPagination = () => {
    pageNumber = 1
  }

  $: if (nameSearch || !nameSearch || sortBy || categorySlug || !categorySlug) {
    resetPagination()
  }

  $: if (browser) {
    search(nameSearch, categorySlug, sortBy, pageNumber)
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
  <div class="flex space-x-2 w-full justify-between items-center">
    <div class="flex w-full items-center <lg:flex-col">
      <input
        class="bg-white border-t  border-b border-l rounded-tl border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:rounded-bl lg:w-8/10 <lg:rounded-tr !lg:border-r-0 !<lg:border-b-0 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
        type="search"
        bind:value={nameSearch}
        placeholder="Enter a keyword for search"
      />
      <div class="flex w-full lg:w-2/10">
        <select
          class="bg-white border-t border-b border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:rounded-tr <lg:rounded-b dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
          bind:value={categorySlug}
        >
          <option value="">All categories</option>
          {#each $layoutData.store?.categories || [] as category}
            <option value={category.slug}>{category.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div
      class="flex items-end lg:space-x-2 lg:items-center <lg:flex-col-reverse"
    >
      <div class="flex space-x-2 items-center <lg:pt-4">
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
          <!-- <p>{pageNumber}</p> -->
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
            <p class="font-bold">Search term</p>
            <label class="flex font-normal space-x-2 text-xs">
              <input
                type="radio"
                value={sorters.searchTerm.asc}
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
                value={sorters.searchTerm.desc}
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
  {#if entries && !entries.length}
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
      {#if !entries}
        <div class="h-64vh w-full skeleton" />
      {:else if $media.small}
        <div
          class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
        >
          {#each entries as e, idx}
            <div
              class="flex flex-col space-y-2 w-full p-2 text-gray-700 dark:text-gray-400"
            >
              <div class="flex w-full items-center justify-between">
                <div class="flex space-x-2 items-center">
                  <div class="relative">
                    <div
                      class="rounded-full flex bg-green-500 h-8px animate-ping w-8px absolute"
                    />
                    <div
                      class="rounded-full flex bg-green-500 h-8px w-8px relative"
                    />
                  </div>
                  <p class="text-xs">
                    <span
                      class="rounded cursor-pointer font-bold font-mono bg-gray-100 p-1 dark:bg-gray-700"
                      title="Copy address"
                      on:click={() => {
                        navigator.clipboard.writeText(e.ip)
                      }}
                      use:tooltip>{e.ip}</span
                    >
                  </p>
                </div>
                <p class="text-xs">{e.createdAt.toLocaleString()}</p>
              </div>
              <p class="text-sm" class:font-bold={e.searchTerm}>
                {e.searchTerm || 'N/A'}
              </p>
              {#if e.category}
                <p class="text-xs" class:font-bold={e.category}>
                  {e.category?.name || 'N/A'}
                </p>
              {/if}
              {#if e.customer}
                <a
                  href="/stores/{$layoutData.store?.slug}/customers/{e.customer
                    .id}"
                  class="font-bold space-x-2 text-gray-800 inline-flex items-center !text-xs dark:text-white hover:underline"
                >
                  <span>
                    {e.customer.firstName}
                    {e.customer.lastName}
                  </span>
                  <Launch16 class="inline-flex" />
                </a>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <table
          class="text-sm text-left w-full text-gray-500 relative overflow-auto dark:text-gray-400"
        >
          <thead
            class="bg-gray-50 text-xs top-0 text-gray-700 z-20 uppercase sticky dark:bg-gray-700 dark:text-gray-400"
          >
            <tr>
              <th scope="col" class="py-3 px-6"> Search term </th>
              <th scope="col" class="py-3 px-6"> Category </th>
              <th scope="col" class="py-3 px-6"> Customer </th>
              <th scope="col" class="py-3 px-6"> IP Address </th>
              <th scope="col" class="py-3 px-6"> Date </th>
            </tr>
          </thead>
          <tbody>
            {#each entries as e, idx}
              <tr
                class="bg-white dark:bg-gray-800"
                class:border-b={idx !== entries.length - 1}
                class:dark:border-gray-700={idx !== entries.length - 1}
              >
                <th
                  scope="row"
                  class="py-4 px-6 whitespace-nowrap"
                  class:font-normal={!e.searchTerm}
                >
                  <p class="text-xs">{e.searchTerm || 'N/A'}</p>
                </th>
                <td class="py-4 px-6">
                  <p>{e.category?.name || 'N/A'}</p>
                </td>
                <td>
                  <div class="flex w-full py-4 px-6">
                    {#if e.customer}
                      <a
                        href="/stores/{$layoutData.store?.slug}/customers/{e
                          .customer.id}"
                        class="font-bold space-x-2 text-xs text-gray-800 inline-flex items-center dark:text-white hover:underline"
                      >
                        <span>
                          {e.customer.firstName}
                          {e.customer.lastName}
                        </span>
                        <Launch16 class="inline-flex" />
                      </a>
                    {:else}
                      <p class="font-bold text-xs w-full">N/A</p>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="flex py-4 px-6">
                    <div class="flex space-x-2 items-center">
                      <div class="relative">
                        <div
                          class="rounded-full flex bg-green-500 h-8px animate-ping w-8px absolute"
                        />
                        <div
                          class="rounded-full flex bg-green-500 h-8px w-8px relative"
                        />
                      </div>
                      <p class="text-xs">
                        <span
                          class="rounded cursor-pointer font-bold font-mono bg-gray-100 p-1 dark:bg-gray-700"
                          title="Copy address"
                          on:click={() => {
                            navigator.clipboard.writeText(e.ip)
                          }}
                          use:tooltip>{e.ip}</span
                        >
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex py-4 px-6">
                    <p class="font-bold text-xs">
                      {e.createdAt.toLocaleString()}
                    </p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>
