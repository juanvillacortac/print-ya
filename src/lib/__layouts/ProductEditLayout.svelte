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
    Launch16,
    ZoomFit16,
    ZoomIn16,
    ZoomOut16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Preview from '$lib/components/Preview.svelte'
  import { writable } from 'svelte/store'
  import ProductModifiersEditor from './ProductModifiersEditor.svelte'
  import type { TemplateSource } from '$lib/compiler'
  import ProductMainFieldsEditor from './ProductMainFieldsEditor.svelte'
  import ProductMockupImagesEditor from './ProductMockupImagesEditor.svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'

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
    if (!product.name?.trim()) {
      alert('Product should have a title')
      return
    }
    for (let m of modifiers?.filter((m) => m.active)) {
      if (!m.name) {
        alert('Modifiers should have a title')
        return
      }
      if (m.type == 'select' || m.type == 'font') {
        if (!m.items?.filter((i) => i.active).length) {
          alert('Selection and multiple selection modifier should have items')
          return
        }
        for (let i of m.items) {
          if (!i.name) {
            alert('Modifier items should have a title')
            return
          }
        }
      }
      if (m.type == 'font') {
        for (let i of m.items) {
          if (!i.meta.url) {
            alert('Font items should have a valid URL')
            return
          }
        }
      }
      if (m.type == 'color') {
        for (let i of m.items) {
          if (!i.name) {
            alert('Color items should have a value')
            return
          }
          if (!i.meta.name) {
            alert('Color items should have a name')
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
</script>

<h2
  class="font-bold font-title mx-auto my-2 text-black text-xl w-full lg:max-w-9/10 dark:text-white"
>
  <span>
    {product.id ? title : 'New product'}&nbsp;
  </span>
  {#if product.id}
    <a
      class="border-transparent inline hover:border-current"
      href={getAbsoluteURL({
        subdomain: !store.customDomain ? store.slug : undefined,
        host: store.customDomain || undefined,
        path: `/products/${product.slug}`,
      })}
      target="__blank"
      title="View product on production"
      use:tooltip
    >
      <Launch16 class="!inline-flex" />
    </a>
  {/if}
</h2>
<form
  on:submit|preventDefault|stopPropagation={submit}
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-9/10"
>
  <div class="flex lg:items-center lg:justify-end <lg:flex-col">
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
    class="w-full grid gap-4 grid-cols-1 items-start"
    class:lg:grid-cols-3={product.template && product.type === 'template'}
  >
    <div
      class="flex flex-col space-y-6 w-full"
      class:lg:col-span-2={product.template && product.type === 'template'}
    >
      <ProductMainFieldsEditor bind:product />
      <ProductMockupImagesEditor bind:product />
      <ProductModifiersEditor bind:modifiers />
    </div>
    {#if product.template && product.type === 'template'}
      <TemplatePreview mockups={product.meta?.mockups} template={$editor} />
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
