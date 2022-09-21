<script lang="ts">
  import trpc from '$lib/trpc/client'
  import { createEventDispatcher, tick } from 'svelte'
  import {
    Checkmark16,
    ChevronDown16,
    ChevronLeft24,
    ChevronRight24,
    ChevronSort16,
    ChevronUp16,
    Launch16,
    TrashCan16,
    View16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/environment'
  import Submenu from '$lib/components/Submenu.svelte'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Ufo from '$lib/components/__Ufo.svelte'
  import { layoutData, watchMedia } from '$lib/stores'
  import { tooltip } from '$lib/components/tooltip'
  import { clamp } from '$lib/utils/math'
  import type { InferQueryInput, InferQueryOutput } from '@shackcart/trpc'
  import type { ProductsGroup } from '@shackcart/db'

  export let data: InferQueryOutput<'products:groups:list'> | undefined =
    undefined

  let pageNumber = 1
  $: pages = Math.ceil((data?.count || 1) / 20)

  let frame: HTMLDivElement | undefined

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let nameSearch = ''
  let categorySlug = ''
  const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        data = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('products:groups:list', {
        storeId: $layoutData.store!.id,
        filter: nameSearch,
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
        page: pageNumber,
      })
      clearTimeout(waitTimeout)
      data = filtered
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
      keyof NonNullable<InferQueryInput<'products:groups:list'>['orderBy']>,
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
  }

  let sortBy: {
    prop: keyof NonNullable<InferQueryInput<'products:groups:list'>['orderBy']>
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
  const deleteGroup = async (id: string) => {
    await trpc().mutation('products:groups:delete', id)
    search()
  }

  export const dispatcher = createEventDispatcher<{
    select: { group: ProductsGroup }
  }>()
  export let selection = false
</script>

<div
  class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 w-full p-4 dark:bg-gray-800 dark:border-gray-600"
>
  <div class="flex space-x-2 w-full justify-between items-center">
    <div class="flex w-full items-center <lg:flex-col">
      <input
        class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
        type="search"
        bind:value={nameSearch}
        placeholder="Enter a keyword for search"
      />
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
          <p class="font-bold">Name</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input type="radio" value={sorters.name.asc} bind:group={sortBy} />
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
  {#if data && !data.groups.length}
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
      class="bg-white border rounded-lg flex border-gray-300 w-full max-h-40vh relative overflow-auto dark:bg-gray-800 dark:border-gray-700"
      bind:this={frame}
    >
      {#if !data}
        <div class="h-40vh w-full skeleton" />
      {:else}
        <table
          class="text-sm text-left w-full text-gray-500 relative overflow-auto dark:text-gray-400"
        >
          <thead
            class="bg-gray-50 text-xs top-0 text-gray-700 z-20 uppercase sticky dark:bg-gray-700 dark:text-gray-400"
          >
            <tr>
              <th scope="col" class="py-3 px-6"> Name </th>
              <th scope="col" class="py-3 px-6"> Description </th>
              <th scope="col" class="py-3 px-6"> Products </th>
              <th scope="col" class="text-right py-3 px-6"> Actions </th>
            </tr>
          </thead>
          <tbody>
            {#each data.groups as c, idx}
              <tr
                class="bg-white dark:bg-gray-800"
                class:border-b={idx !== data.groups.length - 1}
                class:dark:border-gray-700={idx !== data.groups.length - 1}
              >
                <th
                  scope="row"
                  class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
                >
                  <p class="font-bold text-xs">
                    {c.name}
                  </p>
                </th>
                <td>
                  <div class="flex py-4 px-6">
                    <p class="text-xs" class:italic={c.description?.trim()}>
                      {c.description || '(Without description)'}
                    </p>
                  </div>
                </td>
                <td>
                  <div class="flex py-4 px-6">
                    <p class="font-normal text-xs">
                      {c.products} products
                    </p>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div
                    class="flex space-x-2 items-center justify-end <sm:ml-auto"
                  >
                    {#if !selection}
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 text-red-500 duration-200 items-center hover:border-red-500"
                        type="button"
                        on:click={() => deleteGroup(c.id)}
                      >
                        <div class="text-xs">Delete</div>
                        <TrashCan16 /></button
                      >
                    {/if}
                    <a
                      class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                      href="/stores/{$layoutData.store
                        ?.slug}/products/groups/{c.id}"
                      target={selection ? '_blank' : undefined}
                    >
                      <div class="text-xs">{selection ? 'View' : 'Edit'}</div>
                      <View16 /></a
                    >
                    {#if selection}
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 text-green-500 duration-200 items-center hover:border-green-500"
                        type="button"
                        on:click={() => dispatcher('select', { group: c })}
                      >
                        <div class="text-xs">Select group</div>
                        <Checkmark16 /></button
                      >
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div class="flex w-full items-center justify-between">
      <span class="font-bold text-xs leading-0">
        {#if data}
          {data.count} entries found
        {:else}
          Loading groups...
        {/if}
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
