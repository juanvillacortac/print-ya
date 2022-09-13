<script lang="ts">
  import 'bytemd/dist/index.css'
  import type { Product, ProductModifier, TemplateSource } from '@shackcart/db'
  import { notifications } from '$lib/components/notifications'
  import { goto, invalidateAll } from '$app/navigation'
  import {
    Copy16,
    Launch16,
    Template16,
    TrashCan16,
    View16,
    ViewOff16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { writable, type Writable } from 'svelte/store'
  import ProductModifiersEditor from './ProductModifiersEditor.svelte'
  import ProductMainFieldsEditor from './ProductMainFieldsEditor.svelte'
  import ProductMockupImagesEditor from './ProductMockupImagesEditor.svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'
  import trpc, { invalidateQuery } from '$lib/trpc/client'
  import Submenu from '$lib/components/Submenu.svelte'
  import BasicTemplateEditor from './BasicTemplateEditor.svelte'
  import { layoutData } from '$lib/stores'
  import { getBasicTemplate } from '@shackcart/db/dist/utils'
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { getContext } from 'svelte'

  $: store = $layoutData.store!

  let mode: 'main' | 'template' | 'mockups' | 'modifiers' = 'main'

  export let product: Partial<Product> & Pick<Product, 'meta' | 'modifiers'> = {
    price: 0.01,
    public: true,
    type: 'template',
    meta: {},
    modifiers: [],
  }

  $: modes = [
    {
      kind: 'main',
      title: 'Main fields',
      valid: () => true,
    },
    {
      kind: 'modifiers',
      title: 'Modifiers',
      valid: () => true,
    },
    {
      kind: 'template',
      title: 'Design editor',
      valid: () => product.type === 'template',
    },
    {
      kind: 'mockups',
      title: 'Mockups images',
      valid: () => product.type?.startsWith('template'),
    },
  ]

  const template = writable(
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

  const validate = () => {
    if (!product.name?.trim()) {
      alert('Product should have a title')
      return false
    }
    for (let m of modifiers?.filter((m) => m.active)) {
      const items = m.items!.filter((i) => i.active)
      if (!m.name) {
        alert('Modifiers should have a title')
        return false
      }
      if (m.type == 'select' || m.type == 'font') {
        if (!items.length) {
          alert('Selection and multiple selection modifier should have items')
          return false
        }
        for (let i of items) {
          if (!i.name) {
            alert('Modifier items should have a title')
            return false
          }
        }
      }
      if (m.type == 'upsell') {
        if (!items.length) {
          alert('Selection and multiple selection modifier should have items')
          return false
        }
        for (let i of items) {
          if (!i.name) {
            alert('Upsell product should have a name')
            return false
          }
          if (!i.meta.image) {
            alert('Upsell product should have an image')
            return false
          }
        }
      }
      if (m.type == 'font') {
        for (let i of items) {
          if (!i.meta.url) {
            alert('Font items should have a valid URL')
            return false
          }
        }
      }
      if (m.type == 'color') {
        for (let i of items) {
          if (!i.name) {
            alert('Color items should have a value')
            return false
          }
          if (!i.meta.name) {
            alert('Color items should have a name')
            return false
          }
        }
      }
    }
    return true
  }

  const duplicate = async () => {
    if (validate()) {
      const data = await trpc().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          ...product,
          id: '',
          public: false,
          modifiers,
        },
      })
      goto(`/stores/${store.slug}/products/${data!.slug!}`)
    }
  }

  let useGlobalMockups = !product.meta?.ignoreGlobalMockups

  $: if (!product.meta?.mockups) {
    product.meta = {
      ...(product.meta || {}),
      mockups: [],
    }
  }

  $: product.meta.ignoreGlobalMockups = !useGlobalMockups

  const globalMockups =
    getContext<Writable<Record<'path' | 'url', string>[]>>('global-mockups') ||
    writable<Record<'path' | 'url', string>[]>([])

  $: submit = async () => {
    if (!validate()) {
      return
    }
    try {
      saving = true
      await trpc().mutation('stores:sharedData:setMockups', {
        mockups: $globalMockups,
        storeId: $layoutData.store?.id || '',
      })
      const data = await trpc().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          id: product.id,
          slug: product.slug,
          description: product.description,
          meta: product.meta,
          name: product.name,
          price: product.price,
          type: product.type,
          public: product.public,
          minQuantity: product.minQuantity,
          tags: product.tags,
          categories: product.categories,
          modifiers,
          storeId: store.id,
        },
      })
      notifications.send(
        `Product ${product.id ? 'updated' : 'created'}`,
        'default',
        3000
      )
      if (!product.id) {
        goto(`/stores/${store.slug}/products/${data?.slug}`)
        return
      }
      title = data!.name
      modifiers = data!.modifiers!.map((m) => ({
        ...m,
        internalId: (Math.random() + 1).toString(36).substring(7),
        items: m.items!.map((i) => ({
          ...i,
          internalId: (Math.random() + 1).toString(36).substring(7),
        })),
      }))
      invalidateAll()
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  // $: if ($globalMockups) {
  //   trpc().mutation('stores:sharedData:setMockups', {
  //     mockups: $globalMockups,
  //     storeId: $layoutData.store?.id || '',
  //   })
  // }

  const deleteProduct = async () => {
    saving = true
    try {
      const data = await trpc().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          id: product.id,
          archived: !product.archived,
        },
      })
      if (data?.archived) {
        goto(`/stores/${store.slug}/deleted-products`)
      } else {
        await invalidateQuery(
          'products:getBySlug',
          'products:list',
          'products:listDeleted'
        )
        saving = false
        // window.location.reload()
      }
    } catch (err) {
      saving = false
    }
  }

  let modifiers: (ProductModifier & { internalId?: string })[] = [
    ...(product?.modifiers! || []),
  ]
</script>

<h2
  class="font-bold font-title mx-auto my-2 text-black text-xl w-full lg:max-w-10/10 dark:text-white"
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
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-10/10"
>
  <div class="flex flex-col space-y-4 lg:items-end">
    <div
      class="flex justify-end items-end lg:space-x-2 lg:items-center <lg:flex-col <lg:space-y-4"
    >
      {#if !product.archived}
        <Submenu title="Options">
          <div
            class="flex flex-col font-bold space-y-3 text-xs items-end"
            slot="body"
          >
            <button
              class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
              type="button"
              class:text-red-500={product.public}
              on:click={() => (product.public = !product.public)}
              disabled={saving}
            >
              <span>{product.public ? 'Unpublish' : 'Publish'}</span>
              <svelte:component
                this={product.public ? ViewOff16 : View16}
                class="flex"
              /></button
            >
            {#if product.type === 'template_pro' && product.id}
              <a
                href="/stores/{store.slug}/products/{product.slug}/ide"
                class="flex font-normal space-x-2 text-right items-center hover:underline"
              >
                <span
                  >Edit template{JSON.stringify(product.templateDraft) !==
                  JSON.stringify(product.template)
                    ? ' (Draft)'
                    : ''}</span
                >
                <Template16 class="flex" /></a
              >
            {/if}
            {#if product.id}
              <button
                class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                type="button"
                on:click={duplicate}
                disabled={saving}
              >
                <span>Duplicate product</span> <Copy16 class="flex" /></button
              >
              {#if !product.archived}
                <button
                  class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  type="button"
                  on:click={deleteProduct}
                  disabled={saving}
                >
                  <span>Send to trash</span> <TrashCan16 class="flex" /></button
                >
              {/if}
            {/if}
          </div>
        </Submenu>
      {/if}
      {#if product.archived}
        <button
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          type="button"
          on:click={deleteProduct}
          disabled={saving}>{saving ? 'Saving...' : 'Restore product'}</button
        >
      {:else}
        <button
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
        >
      {/if}
    </div>
  </div>
  <div
    class="w-full grid gap-6 grid-cols-1 items-start"
    class:lg:grid-cols-3={product.type?.startsWith('template')}
  >
    <div
      class="flex flex-col space-y-6 w-full"
      class:lg:col-span-2={product.type?.startsWith('template')}
    >
      <div
        class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
      >
        <div
          class="flex flex-wrap text-sm w-full text-gray-500 gap-4 items-center !font-bold"
        >
          {#each modes.filter((m) => m.valid()) as m}
            <button
              type="button"
              class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
              class:border-gray-800={m.kind == mode}
              class:dark:border-white={m.kind == mode}
              class:text-gray-800={m.kind == mode}
              class:dark:text-white={m.kind == mode}
              on:click={() => {
                // @ts-ignore
                mode = m.kind
              }}>{m.title}</button
            >
          {/each}
        </div>
        <div class="flex w-full">
          {#if mode == 'main'}
            <ProductMainFieldsEditor bind:product />
          {:else if mode == 'template'}
            <BasicTemplateEditor bind:product {modifiers} />
          {:else if mode == 'mockups'}
            <div class="flex flex-col space-y-4 w-full">
              <label class="flex font-bold space-x-2 text-xs items-center">
                <input type="checkbox" bind:checked={useGlobalMockups} />
                <span>Use global mockups</span>
              </label>
              <div
                class:opacity-50={product.meta.ignoreGlobalMockups}
                class:cursor-not-allowed={product.meta.ignoreGlobalMockups}
                class:filter={product.meta.ignoreGlobalMockups}
                class:brightness-50={product.meta.ignoreGlobalMockups}
              >
                <ProductMockupImagesEditor
                  title="Global mockups images"
                  bind:mockups={$globalMockups}
                  disabled={product.archived ||
                    product.meta.ignoreGlobalMockups}
                />
              </div>
              <ProductMockupImagesEditor bind:mockups={product.meta.mockups} />
            </div>
          {:else if mode == 'modifiers'}
            <ProductModifiersEditor
              bind:modifiers
              disabled={product.archived}
            />
          {/if}
        </div>
      </div>
    </div>
    {#if product.type?.startsWith('template')}
      <TemplatePreview
        mockups={product.meta?.mockups}
        ignoreGlobalMockups={product.meta?.ignoreGlobalMockups}
        template={product.type === 'template'
          ? getBasicTemplate(product)
          : $template}
      />
    {/if}
  </div>
</form>
