<script lang="ts">
  import { goto } from '$app/navigation'

  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Product, Store } from '$lib/db'
  import { uploadFile } from '$lib/supabase'
  import trpc from '$lib/trpc/client'
  import {
    generateDefaultModifiers,
    getBasicTemplate,
    parseShopifyProductsCSV,
  } from '$lib/utils/modifiers'
  import {
    Category32,
    Checkmark24,
    Close24,
    CloudUpload32,
  } from 'carbon-icons-svelte'
  import Portal, { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import { fade, fly } from 'svelte/transition'

  const store = $page.stuff.store as Store | null

  $pageSubtitle = 'Import products from Shopify'

  let products: (Partial<Product> & { internalId: string })[] | undefined
  let toImport: string[] = []

  function upload(event) {
    const input = event.target.files[0]

    const reader = new FileReader()

    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        uploading = true
        const { path } = await uploadFile({
          file: input,
          bucket: 'assets',
          path: '/shopify',
        })
        uploading = false
        trpc().mutation('utils:importShopifyProducts', {
          storeId: store!.id,
          supabasePath: path,
        })
      }
    }
    reader.readAsText(input)
  }
  let submitDialog = false
  let category: string | undefined = ''
  let uploading = false
  const submit = async () => {
    try {
      uploading = true
      const selected =
        products?.filter((p) => toImport.includes(p.internalId)) || []
      await Promise.all(
        selected.map((product) =>
          trpc().mutation('products:upsert', {
            storeSlug: store!.slug,
            data: {
              ...product,
              storeCategoryId: category,
              storeId: store!.id,
              public: true,
            },
          })
        )
      )
      goto(`/stores/${store?.slug}/products`)
    } catch (err) {
      console.log(err)
    } finally {
      uploading = false
    }
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Import products from Shopify
</h2>

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
      }}
    />
    <form
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-800"
      style="will-change: transform"
      on:submit|preventDefault|stopPropagation={submit}
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Import {toImport.length} products
        </h4>
        <button
          type="button"
          on:click={() => {
            submitDialog = false
            category = ''
          }}><Close24 /></button
        >
      </div>
      <div class="flex space-x-4 items-center">
        <Category32 class="h-48px text-blue-500 w-48px" />
        <div class="flex flex-col space-y-2 w-full">
          <p class="font-bold">Select a category for import the products</p>
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
    </form>
  </div>
{/if}

{#if toImport?.length}
  <Portal>
    <div
      class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center"
      transition:fly|local={{ y: 10, duration: 400, easing: expoOut }}
    >
      <button
        class="rounded-full flex bg-red-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
        title="Clear selection"
        use:tooltip
        on:click={() => (toImport = [])}
      >
        <Close24 />
      </button>
      <button
        class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 relative hover:scale-95"
        title="Import products"
        on:click={() => (submitDialog = true)}
        use:tooltip
      >
        <div
          class="rounded-full flex font-bold bg-red-500 h-6 shadow text-xs -top-1 -right-1 w-6 justify-center items-center absolute"
        >
          {toImport.length}
        </div>
        <Checkmark24 />
      </button>
    </div>
  </Portal>
{/if}

{#if !products}
  <div
    class="flex-grow flex h-full w-full py-24 justify-center items-center relative"
  >
    <input
      type="file"
      accept=".csv"
      class="inset-0 absolute hidden"
      id="csv-input"
      on:change={upload}
    />
    <button
      class="border-dashed rounded-lg flex flex-col space-x-4 border-3 border-gray-300 p-4 w-6/10 items-center !mx-auto lg:w-4/10 dark:border-gray-600"
      on:click={() => document.getElementById('csv-input')?.click()}
    >
      <CloudUpload32 class="text-gray-500" />
      <div class="font-bold text-center text-gray-500">
        {uploading ? 'Uploading...' : 'Upload CSV file'}
      </div>
    </button>
  </div>
{:else}
  <div
    class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
  >
    <div
      class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      in:fly|local={{ y: 10, duration: 400 }}
    >
      {#each products as p (p.internalId)}
        {@const selected = toImport?.includes(p.internalId || '')}
        <div
          class="bg-white border rounded-lg cursor-pointer border-gray-300 transform transition-all relative dark:bg-gray-800 dark:border-gray-600 hover:shadow-lg hover:scale-102"
          style="will-change: transform"
          class:!shadow={selected}
          class:!scale-102={selected}
          class:!border-blue-500={selected}
        >
          {#if selected}
            <button
              type="button"
              transition:fly|local={{
                y: 5,
                easing: expoOut,
                duration: 400,
              }}
              class="bg-white border rounded-full border-gray-300 shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700 dark:border-gray-600"
            >
              <Close24 />
            </button>
          {/if}
          <input
            type="checkbox"
            class="cursor-pointer h-full w-full opacity-0 z-20 absolute"
            bind:group={toImport}
            value={p.internalId}
          />
          <div class="flex flex-col space-y-2 p-2">
            {#if p.meta}
              <div class="flex h-full w-full pointer-events-none aspect-square">
                <TemplatePreview
                  lazy
                  showFonts
                  template={getBasicTemplate(p)}
                  controls={false}
                />
              </div>
            {/if}
            <div
              class="flex flex-col flex-grow h-full space-y-1 justify-between"
            >
              <div class="flex flex-col space-y-1">
                <div class="font-bold text-sm <sm:text-xl">{p.name}</div>
              </div>
              <div class="flex w-full justify-between items-end">
                <p class="font-bold self-end">
                  ${p.price?.toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
