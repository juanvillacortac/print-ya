<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const { products } = await trpc(fetch).query('products:list', {
      storeSlug: params.slug,
    })
    return {
      props: {
        products,
      },
      stuff: {
        ...stuff,
      },
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Ufo from '$lib/components/__Ufo.svelte'
  import type { Store, StripedProduct } from '$lib/db'
  import { uploadFile } from '$lib/supabase'
  import { invalidateQuery } from '$lib/trpc/client'
  import { getBasicTemplate } from '$lib/utils/modifiers'
  import { search } from '$lib/utils/search'
  import {
    Add24,
    Category32,
    CheckmarkFilled32,
    Close24,
    CloudUpload32,
    TrashCan16,
    TrashCan24,
    Upload24,
    View16,
    ViewOff16,
  } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal, { portal } from 'svelte-portal'
  import { elasticOut, expoOut } from 'svelte/easing'
  import type { Writable } from 'svelte/store'
  import { fade, fly, scale, slide } from 'svelte/transition'
  import ProductsList from '$lib/__app/ProductsList.svelte'
  import { squareratio } from '$lib/actions/aspectratio'
  const store = $page.stuff.store as Store | null
  export let products: StripedProduct[]

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

  async function upload() {
    if (!csv) return
    uploading = true
    const { path } = await uploadFile({
      file: csv,
      bucket: 'assets',
      path: '/shopify',
    })
    uploading = false
    trpc().mutation('utils:importShopifyProducts', {
      categoryId: category || undefined,
      storeId: store!.id,
      supabasePath: path,
    })
    done = true
  }

  let category = ''
  let uploading = false
  let csv: File | undefined
  let submitDialog = true
  let done = false

  const navHeight: Writable<number> = getContext('navHeight')
</script>

{#if submitDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => {
        submitDialog = false
        category = ''
        done = false
      }}
    />
    <form
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-5/10 dark:bg-gray-800"
      style="will-change: transform"
      on:submit|preventDefault|stopPropagation={upload}
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4
          class="font-bold text-xl text-black leading-thight pr-6 dark:text-white"
        >
          Import products from Shopify
        </h4>
        <button
          type="button"
          on:click={() => {
            submitDialog = false
            category = ''
            done = false
          }}><Close24 /></button
        >
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
        <div class="flex space-x-4 items-center">
          <div class="flex flex-col space-y-2 w-full">
            <p class="font-bold text-xs">Import to a category (optional)</p>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={category}
            >
              {#each store?.categories || [] as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>
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
          class="border-dashed rounded-lg flex flex-col space-x-4 border-3 border-gray-300 w-full p-4 items-center !mx-auto dark:border-gray-600"
          on:click={() => document.getElementById('csv-input')?.click()}
        >
          <CloudUpload32 class="text-gray-500" />
          <div class="font-bold text-center text-sm text-gray-500">
            {uploading ? 'Uploading...' : csv?.name || 'Upload CSV file'}
          </div>
        </button>
        <div class="flex space-x-2 items-center justify-end">
          <button
            type="button"
            class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
            on:click={() => {
              submitDialog = false
              category = ''
            }}>Cancel</button
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
  Products
</h2>

<Portal>
  <div
    class="< flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
    style:--nh="{$navHeight}px"
  >
    <a
      class="rounded-full flex bg-red-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Deleted products"
      href="deleted-products"
      use:tooltip
    >
      <TrashCan24 />
    </a>
    <button
      class="rounded-full flex bg-green-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Import products from Shopify"
      use:tooltip
      on:click={() => (submitDialog = true)}
    >
      <Upload24 />
    </button>
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

<ProductsList />
