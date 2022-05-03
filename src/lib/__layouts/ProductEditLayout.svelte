<script lang="ts">
  import 'bytemd/dist/index.css'
  import { page } from '$app/stores'
  import type { Product, Store } from '$lib/db'
  const store = $page.stuff.store as Store
  import { Editor } from 'bytemd'
  import { post } from '$lib/api'
  import { notifications } from '$lib/components/notifications'
  import { goto } from '$app/navigation'
  import {
    Checkbox16,
    ZoomFit16,
    ZoomIn16,
    ZoomOut16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Preview from '$lib/components/Preview.svelte'
  import { writable } from 'svelte/store'

  export let product: Partial<Product> = {
    price: 0.01,
    public: true,
    isTemplate: false,
  }

  const editor = writable(
    JSON.parse(product?.template || 'null') || {
      name: 'Template test',
      html: '',
      css: '',
      fields: '',
      windi: true,
      width: 300,
      height: 300,
      sizeUnit: 'px',
    }
  )

  let title = product.name

  const submit = async () => {
    try {
      const data = await post<Product>(`/api/stores/${store.slug}/products`, {
        ...product,
        storeId: store.id,
      })
      notifications.send(
        `Product ${product.id ? 'updated' : 'created'}`,
        'default',
        3000
      )
      if (!product.id) {
        goto(`/app/stores/${store.slug}/products`)
        return
      }
      title = data.name
    } catch (err) {
      console.log(err.message, err.error)
    }
  }

  let border = true

  let scale = 100

  const zoomIn = () => (scale = Math.max(10, Math.min(scale + 10, 200)))
  const zoomOut = () => (scale = Math.max(10, Math.min(scale - 10, 200)))
</script>

<form
  on:submit|preventDefault|stopPropagation={submit}
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-9/10"
>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col">
    <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
      {product.id ? title : 'New product'}
    </h3>
    <div
      class="flex justify-end items-end lg:space-x-6 lg:items-center <lg:flex-col <lg:space-y-4 <lg:hidden"
    >
      <div class="flex space-x-4 items-center">
        <input
          type="checkbox"
          id="isTemplate"
          bind:checked={product.isTemplate}
        />
        <label class="font-bold text-xs block" for="isTemplate">
          Is a template
        </label>
      </div>
      <div class="flex space-x-4 items-center">
        <input type="checkbox" id="published" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div>
      {#if product.isTemplate && product.id}
        <a
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          href="/app/stores/{store.slug}/products/{product.slug}/ide"
          >Edit template</a
        >
      {/if}
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        >Save</button
      >
    </div>
  </div>
  <div
    class="grid gap-4 grid-cols-1 items-start"
    class:lg:grid-cols-3={product.template && product.isTemplate}
  >
    <div
      class="flex flex-col space-y-6 w-full"
      class:lg:col-span-2={product.template && product.isTemplate}
    >
      <div
        class="bg-white rounded-xl flex flex-col h-full space-y-4 shadow w-full p-4 relative overflow-hidden <lg:pb-12 dark:bg-gray-800"
      >
        <div class="flex items-center lg:space-x-4 <lg:flex-col <lg:space-y-4">
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Product name
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Ex. Red camera sign"
              required
              bind:value={product.name}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Product category
            </label>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={product.storeCategoryId}
            >
              {#each store.categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Price
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              min={0.01}
              step="any"
              bind:value={product.price}
            />
          </div>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-sm mb-2 block" for="fieldId">
            Description
          </label>
          <Editor
            value={product.description || ''}
            on:change={(e) => (product.description = e.detail.value)}
          />
        </div>
      </div>
    </div>
    {#if product.template && product.isTemplate}
      <div class="flex h-full w-full relative" style="aspect-ratio: 1/1">
        <div
          class="border rounded h-full border-gray-300 w-full absolute overflow-auto checkerboard dark:border-gray-800"
        >
          <div
            class="origin-top-left transition-transform duration-200"
            style="transform: scale({scale / 100})"
          >
            <Preview template={$editor} bind:border />
          </div>
        </div>
        <div
          class="flex space-x-1 right-1rem bottom-1rem absolute items-center"
        >
          <p class="font-bold text-xs pr-4">{scale}%</p>
          <button
            class="preview-button"
            title="Zoom Out"
            type="button"
            use:tooltip
            on:click={zoomOut}
          >
            <ZoomOut16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            title="Reset zoom"
            type="button"
            use:tooltip
            on:click={() => (scale = 100)}
          >
            <ZoomFit16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            title="Zoom In"
            type="button"
            use:tooltip
            on:click={zoomIn}
          >
            <ZoomIn16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            type="button"
            title="Toggle border"
            use:tooltip
            on:click={() => (border = !border)}
          >
            <Checkbox16 class="font-bold" />
          </button>
        </div>
      </div>
    {/if}
    <div
      class="flex justify-end items-end lg:space-x-6 lg:items-center lg:hidden <lg:flex-col <lg:space-y-4"
    >
      <div class="flex space-x-4 items-center">
        <input type="checkbox" bind:checked={product.isTemplate} />
        <label class="font-bold text-xs block" for="isTemplate">
          Is a template
        </label>
      </div>
      <div class="flex space-x-4 items-center">
        <input type="checkbox" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div>
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        >Save</button
      >
    </div>
  </div>
</form>

<style>
  .preview-button {
    @apply bg-white border-transparent rounded flex border-2 shadow p-1 transform transition-transform duration-200;
  }

  .preview-button:hover {
    @apply -translate-y-px;
  }

  :global(.dark) .preview-button {
    @apply border-transparent bg-gray-700 border-2  border-gray-300;
  }

  :global(.dark) .preview-button:hover {
    @apply border-gray-300;
  }

  .checkerboard {
    --black-cell: rgba(55, 65, 81, 0.2);
    background-image: linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      ),
      linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      );
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
  }
</style>
