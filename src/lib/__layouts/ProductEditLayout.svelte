<script lang="ts">
  import 'bytemd/dist/index.css'
  import { page } from '$app/stores'
  import type { Product, ProductModifier, Store } from '$lib/db'
  const store = $page.stuff.store as Store
  import { Editor } from 'bytemd'
  import { post } from '$lib/api'
  import { notifications } from '$lib/components/notifications'
  import { goto, invalidate } from '$app/navigation'
  import {
    Checkbox16,
    ZoomFit16,
    ZoomIn16,
    ZoomOut16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Preview from '$lib/components/Preview.svelte'
  import { writable } from 'svelte/store'
  import ProductModifiersEditor from './ProductModifiersEditor.svelte'
  import type { TemplateSource } from '$lib/compiler'

  export let product: Partial<Product> = {
    price: 0.01,
    public: true,
    type: 'template',
  }

  const editor = writable(
    (product?.template as TemplateSource) || {
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
  let saving = false

  const submit = async () => {
    console.log(modifiers)
    for (let m of modifiers?.filter((m) => m.active)) {
      if (!m.name) {
        alert('Modifiers should have a title')
        return
      }
      if (m.type == 'select' || m.type == 'multiple') {
        if (!m.items?.filter((i) => i.active).length) {
          alert('Selection and multiple selection modifier should have items')
          return
        }
        for (let i of m.items) {
          if (!i.name) {
            alert('Modifier items should have a title')
            return
          }
          if (!m.name) {
            alert('Modifiers should have a title')
            return
          }
        }
      }
    }
    try {
      saving = true
      const data = await post<Product, Partial<Product>>(
        `/api/stores/${store.slug}/products`,
        {
          ...product,
          modifiers,
          storeId: store.id,
        }
      )
      notifications.send(
        `Product ${product.id ? 'updated' : 'created'}`,
        'default',
        3000
      )
      if (!product.id) {
        goto(`/stores/${store.slug}/products`)
        return
      }
      title = data.name
      modifiers = data.modifiers.map((m) => ({
        ...m,
        internalId: (Math.random() + 1).toString(36).substring(7),
        items: m.items.map((i) => ({
          ...i,
          internalId: (Math.random() + 1).toString(36).substring(7),
        })),
      }))
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  let border = true

  let scale = 100

  let modifiers: (ProductModifier & { internalId?: string })[] = [
    ...(product?.modifiers || []),
  ]

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
      class="flex justify-end items-end lg:space-x-6 lg:items-center <lg:flex-col <lg:space-y-4"
    >
      <div class="flex space-x-4 items-center">
        <input type="checkbox" id="published" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div>
      {#if product.type === 'template' && product.id}
        <a
          class="rounded font-bold border-2 border-blue-500 text-xs text-center py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          href="/stores/{store.slug}/products/{product.slug}/ide"
          >Edit template{JSON.stringify(product.templateDraft) !==
          JSON.stringify(product.template)
            ? ' (Draft)'
            : ''}</a
        >
      {/if}
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
      >
    </div>
  </div>
  <div
    class="grid gap-4 grid-cols-1 items-start"
    class:lg:grid-cols-3={product.template && product.type === 'template'}
  >
    <div
      class="flex flex-col space-y-6 w-full"
      class:lg:col-span-2={product.template && product.type === 'template'}
    >
      <div
        class="bg-white rounded-xl flex flex-col h-full space-y-4 shadow w-full p-4 relative overflow-hidden <lg:pb-12 dark:bg-gray-800"
      >
        <div class="grid gap-4 grid-cols-3">
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
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
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Product type
            </label>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={product.type}
            >
              <option value={'template'}>Custom template</option>
              <option value={'generic'}>Static product</option>
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
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
            <label class="font-bold text-xs mb-2 block" for="fieldId">
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
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Minimum order quantity
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              min={0}
              bind:value={product.minQuantity}
            />
          </div>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Description
          </label>
          <Editor
            value={product.description || ''}
            on:change={(e) => (product.description = e.detail.value)}
          />
        </div>
      </div>
      <ProductModifiersEditor bind:modifiers />
    </div>
    {#if product.template && product.type === 'template'}
      <div class="flex w-full top-0 sticky" style="aspect-ratio: 1/1">
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
    <!-- <div
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
    </div> -->
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
