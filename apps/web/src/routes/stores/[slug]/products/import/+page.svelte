<script lang="ts">
  import { layoutData } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import trpc from '$lib/trpc/client'
  import {
    Add16,
    Add24,
    CheckmarkFilled32,
    Close16,
    Close24,
    CloudUpload32,
    Information16,
  } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal, { portal } from 'svelte-portal'
  import { elasticOut, expoOut } from 'svelte/easing'
  import type { Writable } from 'svelte/store'
  import { fade, fly, scale } from 'svelte/transition'
  import { squareratio } from '$lib/actions/aspectratio'
  import { supabase } from '@shackcart/shared'
  import ImportList from '$lib/__app/ImportList.svelte'
  import { search as s } from '$lib/utils/search'
  import type { Store } from '@shackcart/db'
  import { flip } from 'svelte/animate'

  async function upload() {
    // if (!csv) return
    uploading = true
    try {
      // const { path } = await supabase.uploadFile({
      //   file: csv,
      //   bucket: 'assets',
      //   path: '/shopify',
      // })
      // await trpc().mutation('shopify:create', {
      //   categories: [...new Set(tagsToCategories)],
      //   storeId: $layoutData.store!.id,
      //   supabasePath: path,
      // })
      await trpc().mutation('products:categories:migrate', {
        tags: [...new Set(tagsToCategories)],
        storeId: $layoutData.store!.id,
      })
      resetImport()
      done = true
      if (search) search()
    } catch (err) {
      console.error(err)
    } finally {
      uploading = false
      const el = document.getElementById('csv-input') as HTMLInputElement | null
      if (el) {
        el.value = ''
      }
      csv = undefined
    }
  }

  let uploading = false
  let csv: File | undefined
  let submitDialog = false
  let done = false
  let hovering = false
  let search: () => void | undefined

  const navHeight: Writable<number> = getContext('navHeight')

  function resetImport() {
    csv = undefined
    categoryInput = ''
    categories = []
    tagsToCategories = []
    findingCategories = false
  }

  function closeDialog() {
    resetImport()
    done = false
    submitDialog = false
  }

  let categoryInput = ''
  let categories: NonNullable<Store['categories']> = []
  let categoriesTimeout: NodeJS.Timeout
  let findingCategories = false
  let tagsToCategories: string[] = []
  function searchCategories() {
    const find = async () => {
      categories =
        s($layoutData.store?.categories || [], categoryInput, ['name']).filter(
          (c) => !tagsToCategories?.some((pc) => pc === c.name)
        ) || []
      findingCategories = false
    }
    if (categoriesTimeout) {
      clearTimeout(categoriesTimeout)
    }
    categoriesTimeout = setTimeout(() => find(), 500)
    findingCategories = true
  }
  function deleteCategories() {
    categories = []
    findingCategories = false
  }
  $: if (categoryInput && categoryInput.trim()) {
    searchCategories()
  } else {
    deleteCategories()
  }
</script>

{#if submitDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={closeDialog}
    />
    <form
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-w-9/10 max-h-9/10 p-4 relative lg:max-w-[28%] dark:bg-gray-800"
      style="will-change: transform"
      on:submit|preventDefault|stopPropagation={upload}
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex justify-between items-start">
        <h4
          class="font-bold text-xl text-black leading-thight pr-6 dark:text-white"
        >
          Import products from Shopify
        </h4>
        <button type="button" on:click={closeDialog}><Close24 /></button>
      </div>
      {#if done}
        <div
          class="mx-auto w-4/10 aspect-square"
          use:squareratio
          in:scale={{
            easing: elasticOut,
            start: 0,
            duration: 800,
            opacity: 1,
          }}
        >
          <CheckmarkFilled32 class="h-full w-full text-green-500" />
        </div>
        <div
          class="mx-auto text-center text-gray-500"
          in:fly={{
            delay: 200,
            duration: 400,
            y: 5,
          }}
        >
          When the products have been imported we will send you an email.
        </div>
      {:else}
        <div class="flex flex-col space-y-2 w-full z-40">
          <p class="font-bold text-xs">Categories for tags matching</p>
          <div class="z-30 relative">
            <div class="flex space-x-2 items-center">
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Search or create a category"
                bind:value={categoryInput}
              />
              <button
                type="button"
                class="rounded font-bold border-2 border-blue-500 h-33px text-center text-xs py-1 px-2 text-blue-500 duration-200 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
                on:click={() => {
                  tagsToCategories = [
                    ...new Set([
                      ...($layoutData.store?.categories?.map((c) => c.name) ||
                        []),
                      ...tagsToCategories,
                    ]),
                  ]
                }}>Add all</button
              >
            </div>
            {#if categoryInput.trim()}
              <div
                class="bg-white border rounded divide-y-1 divide-gray-300 border-gray-300 shadow-lg text-xs leading-tight w-full max-h-40 top-10 left-0 z-99 absolute appearance-none overflow-auto dark:divide-gray-600 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                transition:fly|local={{ y: 5, duration: 200 }}
              >
                {#if (!findingCategories && !tagsToCategories?.find((t) => t === categoryInput)) || findingCategories}
                  <div
                    class="flex w-full py-2 px-3 justify-between items-center hover:bg-gray-200 hover:dark:bg-gray-800"
                    class:cursor-pointer={!findingCategories}
                    on:click={() => {
                      if (findingCategories) return
                      tagsToCategories = [
                        categoryInput,
                        ...(tagsToCategories || []),
                      ]
                      categoryInput = ''
                    }}
                  >
                    {#if !findingCategories}
                      <div class="font-bold text-xs">Create category</div>
                      <Add16 />
                    {:else}
                      <div class="font-bold text-xs">Searching...</div>
                    {/if}
                  </div>
                {:else if !categories.length}
                  <div
                    class="flex w-full py-2 px-3 justify-between items-center"
                  >
                    <div class="font-bold text-xs">Nothing found</div>
                  </div>
                {/if}
                {#each categories as category}
                  <div
                    class="cursor-pointer flex w-full py-2 px-3 justify-between items-center hover:bg-gray-200 hover:dark:bg-gray-800"
                    on:click={() => {
                      tagsToCategories = [
                        category.name,
                        ...(tagsToCategories || []),
                      ]
                      categoryInput = ''
                    }}
                  >
                    <div class="text-xs">{category.name}</div>
                    <div class="text-xs opacity-70">
                      {category.count} products
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          <div
            class="border rounded flex flex-wrap border-gray-300 w-full p-4px dark:(bg-gray-700 border-gray-600) "
          >
            {#if !tagsToCategories?.length}
              <div
                class="flex space-x-2 w-full p-2 text-gray-600 justify-center items-center dark:text-gray-400"
              >
                <Information16 />
                <p class="font-bold text-xs whitespace-nowrap">
                  Without categories
                </p>
              </div>
            {:else}
              {#each tagsToCategories as category (category)}
                <div
                  class="p-2px"
                  in:scale={{ start: 0.8, duration: 200 }}
                  animate:flip={{ duration: 200 }}
                >
                  <button
                    type="button"
                    class="rounded flex space-x-1 bg-gray-100 text-xs p-1 transform text-dark-900 duration-200 items-center dark:bg-gray-900 dark:text-white hover:scale-95"
                    style="will-change: transform"
                    title="Delete category"
                    use:tooltip
                    on:click={() => {
                      const tmp = [...(tagsToCategories || [])]
                      const idx = tmp.findIndex((t) => t === category)
                      tmp.splice(idx, 1)
                      tagsToCategories = [...tmp]
                      categoryInput = ''
                    }}
                  >
                    <Close16 class="h-18px w-18px dark:text-gray-500" />
                    <span class="font-bold">
                      {category}
                    </span>
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>
        <div class="flex w-full">
          <label class="flex font-bold space-x-2 text-xs">
            <input type="checkbox" />
            <span>Include all categories for tags matching</span>
          </label>
        </div>
        <input
          type="file"
          accept=".csv"
          class="inset-0 absolute hidden"
          id="csv-input"
          use:portal
          on:change={(e) => {
            // @ts-ignore
            csv = (e.target?.files)[0]
          }}
        />
        <button
          class="border-dashed rounded-lg flex flex-col border-3 border-gray-300 w-full p-4 items-center !mx-auto dark:border-gray-600"
          type="button"
          on:click={() => document.getElementById('csv-input')?.click()}
          on:dragenter|preventDefault|stopPropagation={(e) => {
            hovering = true
          }}
          on:dragover|preventDefault|stopPropagation={(e) => {}}
          on:dragend|preventDefault|stopPropagation={(e) => {
            hovering = false
          }}
          on:drop|preventDefault={(e) => {
            if (e.dataTransfer) {
              const dt = e.dataTransfer
              const files = [...dt.files]
              if (files?.length && files[0].type == 'text/csv') {
                csv = files[0]
              }
              hovering = false
            }
          }}
        >
          <CloudUpload32 class="text-gray-500 pointer-events-none" />
          <div
            class="font-bold text-center text-sm text-gray-500 pointer-events-none"
          >
            {uploading
              ? 'Uploading...'
              : csv?.name || (hovering ? 'Drop file' : 'Upload a CSV file')}
          </div>
        </button>
        <div class="flex space-x-2 items-center justify-end">
          <button
            type="button"
            class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
            on:click={closeDialog}>Cancel</button
          >
          <button
            class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
            disabled={uploading}>{uploading ? 'Uploading...' : 'Import'}</button
          >
        </div>
      {/if}
    </form>
  </div>
{/if}

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Import products from Shopify
</h2>

<Portal>
  <div
    class="< flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
    style:--nh="{$navHeight}px"
  >
    <button
      class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Add new product"
      on:click={() => (submitDialog = true)}
      use:tooltip
    >
      <Add24 />
    </button>
  </div>
</Portal>

<div class="pb-14">
  <ImportList bind:search />
</div>
