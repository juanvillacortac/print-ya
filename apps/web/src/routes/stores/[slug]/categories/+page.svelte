<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  import { layoutData, watchMedia } from '$lib'
  import { notifications } from '$lib/components/notifications'
  import { tooltip } from '$lib/components/tooltip'
  import Ufo from '$lib/components/__Ufo.svelte'
  import trpc, { invalidateQuery } from '$lib/trpc/client'
  import { clamp } from '$lib/utils/math'
  import { search } from '$lib/utils/search'
  import type { ProductCategory } from '@shackcart/db'
  import type { InferMutationInput } from '@shackcart/trpc'
  import {
    Category32,
    ChevronLeft24,
    ChevronRight24,
    Close24,
    TrashCan16,
    View16,
    WarningAlt32,
  } from 'carbon-icons-svelte'
  import { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import { fade, fly, scale } from 'svelte/transition'

  $: store = $layoutData.store
  $: categories = store?.categories || []

  let nameSearch = ''

  let selected: InferMutationInput<'products:categories:upsert'> | undefined

  const saveCategory = async () => {
    if (!selected) return
    try {
      // await trpc().mutation('stores:upsertCategory', {
      //   ...selected,
      //   storeId: store?.id || '',
      // })
      notifications.send(
        'Category ' + (selected.id ? 'updated' : 'created'),
        'default',
        3000
      )
      await invalidateQuery('stores:getBySlug')
    } catch ({ message }) {
      notifications.send(message, 'default', 3000)
    }
    selected = {
      id: '',
      name: '',
      storeId: store?.id || '',
    }
  }

  function paginate(array, page_size, page_number) {
    // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
    return array.slice((page_number - 1) * page_size, page_number * page_size)
  }

  let deleteDialog: ProductCategory | null = null

  let pageNumber = 1
  $: filtered = search(categories, nameSearch || '', ['name'])
  $: paginated = paginate(filtered, 10, pageNumber)
</script>

{#if deleteDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-lg"
    transition:fade={{ duration: 400, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => (deleteDialog = null)}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-900"
      style="will-change: transform"
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Warning
        </h4>
        <button on:click={() => (deleteDialog = null)}><Close24 /></button>
      </div>
      <div class="flex space-x-4 items-center">
        <WarningAlt32 class="h-48px text-red-500 w-48px" />
        <div class="flex flex-col space-y-2">
          <p class="font-bold">Do you want to delete this category?</p>
          <p class="text-sm text-gray-500">Your can't restore this action</p>
        </div>
      </div>
      <div class="flex space-x-2 items-center justify-end">
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          on:click={() => (deleteDialog = null)}>Cancel</button
        >
        <button
          class="rounded font-bold ml-auto border-2 border-red-500 text-xs py-1 px-2 text-red-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-red-500 not-disabled:hover:text-white"
          on:click={() => {
            trpc().mutation(
              'products:categories:delete',
              deleteDialog?.id || ''
            )
            deleteDialog = null
            invalidateAll()
          }}>Delete</button
        >
      </div>
    </div>
  </div>
{/if}

{#if selected}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => {
        selected = undefined
      }}
    />
    <form
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-900"
      style="will-change: transform"
      on:submit|preventDefault|stopPropagation={() => {
        if (!selected) return
        trpc().mutation('products:categories:upsert', selected)
        selected = undefined
        invalidateAll()
      }}
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          {selected.id ? 'Edit' : 'New'} category
        </h4>
        <button
          type="button"
          on:click={() => {
            selected = undefined
          }}><Close24 /></button
        >
      </div>
      <div class="flex space-x-4 items-center">
        <Category32 class="h-48px text-blue-500 w-48px" />
        <div class="flex flex-col space-y-2">
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="text"
            autocomplete="nooooope"
            bind:value={selected.name}
            aria-autocomplete="none"
            placeholder="Category name"
            required
          />
        </div>
      </div>
      <div class="flex space-x-2 items-center justify-end">
        <button
          type="button"
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          on:click={() => {
            selected = undefined
          }}>Cancel</button
        >
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          >Save</button
        >
      </div>
    </form>
  </div>
{/if}

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Categories
  </h3>
  <div
    class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
  >
    <div class="flex space-x-2 w-full justify-between items-center">
      <div class="flex w-full items-center <lg:flex-col">
        <input
          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          type="search"
          bind:value={nameSearch}
          placeholder="Search by name"
        />
      </div>
      <button
        class="rounded font-bold border-2 border-blue-500 h-33px text-xs px-4 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        on:click={() =>
          (selected = {
            name: '',
            storeId: store?.id || '',
          })}>New</button
      >
    </div>
    {#if filtered && !filtered.length}
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
        class="bg-white border rounded-lg flex border-gray-300 w-full max-h-50vh relative overflow-auto dark:bg-gray-800 dark:border-gray-700"
      >
        {#if !categories}
          <div class="h-64vh w-full skeleton" />
        {:else}
          <table
            class="text-sm text-left w-full text-gray-500 relative overflow-auto dark:text-gray-400"
          >
            <thead
              class="bg-gray-50 text-xs top-0 text-gray-700 z-20 uppercase sticky dark:bg-gray-700 dark:text-gray-400"
            >
              <tr>
                <th scope="col" class="py-3 px-6"> Category </th>
                <th scope="col" class="py-3 px-6"> Products </th>
                <th scope="col" class="text-right py-3 px-6"> Actions </th>
              </tr>
            </thead>
            <tbody>
              {#each paginated as c, idx}
                <tr
                  class="bg-white dark:bg-gray-800"
                  class:border-b={idx !== paginated.length - 1}
                  class:dark:border-gray-700={idx !== paginated.length - 1}
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
                      <p class="font-normal text-xs">
                        {c.count} products
                      </p>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div
                      class="flex space-x-2 items-center justify-end <sm:ml-auto"
                    >
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 text-red-500 duration-200 items-center hover:border-red-500"
                        type="button"
                        on:click={() => {
                          deleteDialog = c
                        }}
                      >
                        <div class="text-xs">Delete</div>
                        <TrashCan16 /></button
                      >
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                        on:click={() => {
                          selected = c
                        }}
                      >
                        <div class="text-xs">Edit</div>
                        <View16 /></button
                      >
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
          {filtered.length || 0} categories found
        </span>
        <div class="flex space-x-2 items-center">
          <button
            title="Previous page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({
                min: 1,
                max: filtered.length,
                val: pageNumber - 1,
              })
            }}
          >
            <ChevronLeft24 />
          </button>
          <div
            class="flex font-bold space-x-2 text-xs text-gray-400 uppercase items-center"
          >
            <select
              class="bg-transparent font-bold py-1 appearance-none !border-none !outline-none"
              bind:value={pageNumber}
            >
              {#each Array.from({ length: Math.ceil(filtered.length / 10) })
                .fill({})
                .map((_, idx) => idx + 1) as n}
                <option value={n}>{n}</option>
              {/each}
            </select>
            <span>/</span>
            <p>{Math.ceil(filtered.length / 10)}</p>
          </div>
          <button
            title="Next page"
            use:tooltip
            on:click={() => {
              pageNumber = clamp({
                min: 1,
                max: filtered.length,
                val: pageNumber + 1,
              })
            }}
          >
            <ChevronRight24 />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
