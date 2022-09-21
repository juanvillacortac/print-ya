<script lang="ts">
  import 'bytemd/dist/index.css'
  import type { ProductModifier, ProductsGroup } from '@shackcart/db'
  import { notifications } from '$lib/components/notifications'
  import { goto, invalidateAll } from '$app/navigation'
  import { Copy16, TrashCan16 } from 'carbon-icons-svelte'
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
  import { getContext } from 'svelte'
  import ProductsList from '../ProductsList.svelte'
  import { TEST_TEMPLATE_HTML } from './stuff'

  $: store = $layoutData.store!

  let mode: 'main' | 'template' | 'mockups' | 'modifiers' = 'main'

  export let group: Partial<ProductsGroup> &
    Pick<ProductsGroup, 'meta' | 'modifiers'> = {
    meta: {
      mockups: [],
    },
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
      valid: () => true,
    },
    // {
    //   kind: 'mockups',
    //   title: 'Mockups images',
    //   valid: () => true,
    // },
  ]

  const template = writable({
    name: 'Template test',
    html: '',
    css: '',
    fields: '',
    windi: true,
    width: 300,
    height: 300,
    sizeUnit: 'px',
  })

  let title = group.name
  let saving = false

  const validate = () => {
    if (!group.name?.trim()) {
      alert('Group should have a title')
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
      const data = await trpc().mutation('products:groups:upsert', {
        storeSlug: store.slug,
        data: {
          ...group,
          id: '',
          modifiers,
        },
      })
      goto(`/stores/${store.slug}/products/groups/${data!.id}`)
    }
  }

  let useGlobalMockups = !group.meta?.ignoreGlobalMockups

  $: if (!group.mockups) {
    group.meta = {
      ...(group.meta || {}),
      mockups: [],
    }
  }

  $: submit = async () => {
    if (!validate()) {
      return
    }
    try {
      saving = true
      const data = await trpc().mutation('products:groups:upsert', {
        storeSlug: store.slug,
        data: {
          id: group.id,
          description: group.description,
          meta: group.meta,
          name: group.name,
          modifiers,
          storeId: store.id,
        },
      })
      notifications.send(
        `Group ${group.id ? 'updated' : 'created'}`,
        'default',
        3000
      )
      if (!group.id) {
        goto(`/stores/${store.slug}/products/groups/${data?.id}`)
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
      // const data = await trpc().mutation('products:upsert', {
      //   storeSlug: store.slug,
      //   data: {
      //     id: group.id,
      //     archived: !group.archived,
      //   },
      // })
      // if (data?.archived) {
      //   goto(`/stores/${store.slug}/deleted-products`)
      // } else {
      //   await invalidateQuery(
      //     'products:getBySlug',
      //     'products:list',
      //     'products:listDeleted'
      //   )
      //   saving = false
      //   // window.location.reload()
      // }
    } catch (err) {
      saving = false
    }
  }

  let modifiers: (ProductModifier & { internalId?: string })[] = [
    ...(group?.modifiers! || []),
  ]
</script>

<h2
  class="font-bold font-title mx-auto my-2 text-black text-xl w-full lg:max-w-10/10 dark:text-white"
>
  <span>
    {group.id ? title : 'New group'}&nbsp;
  </span>
</h2>
<form
  on:submit|preventDefault|stopPropagation={submit}
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-10/10"
>
  <div class="flex flex-col space-y-4 lg:items-end">
    <div
      class="flex justify-end items-end lg:space-x-2 lg:items-center <lg:flex-col <lg:space-y-4"
    >
      {#if group.id}
        <Submenu title="Options">
          <div
            class="flex flex-col font-bold space-y-3 text-xs items-end"
            slot="body"
          >
            <button
              class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
              type="button"
              on:click={duplicate}
              disabled={saving}
            >
              <span>Duplicate group</span> <Copy16 class="flex" /></button
            >
            <button
              class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
              type="button"
              on:click={deleteProduct}
              disabled={saving}
            >
              <span>Send to trash</span> <TrashCan16 class="flex" /></button
            >
          </div>
        </Submenu>
      {/if}
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
      >
    </div>
  </div>
  <div class="w-full grid gap-6 grid-cols-1 items-start lg:grid-cols-3">
    <div class="flex flex-col space-y-6 w-full lg:col-span-2">
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
            <div class="flex flex-col h-full space-y-4 w-full relative">
              <div class="flex flex-col space-y-4">
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div class="flex flex-col w-full">
                    <label class="font-bold text-xs mb-2 block" for="fieldId">
                      Group name
                    </label>
                    <input
                      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                      type="text"
                      required
                      bind:value={group.name}
                    />
                  </div>
                  <div class="flex flex-col w-full">
                    <label class="font-bold text-xs mb-2 block" for="fieldId">
                      Group description
                    </label>
                    <input
                      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                      type="text"
                      required
                      bind:value={group.description}
                    />
                  </div>
                </div>
              </div>
            </div>
          {:else if mode == 'template'}
            <BasicTemplateEditor bind:product={group} {modifiers} group />
          {:else if mode == 'mockups'}
            <div class="flex flex-col space-y-4 w-full">
              <label class="flex font-bold space-x-2 text-xs items-center">
                <input type="checkbox" bind:checked={useGlobalMockups} />
                <span>Use global mockups</span>
              </label>
              {#if group.meta}
                <ProductMockupImagesEditor bind:mockups={group.mockups} />
              {/if}
            </div>
          {:else if mode == 'modifiers'}
            <ProductModifiersEditor bind:modifiers />
          {/if}
        </div>
      </div>
      {#if group.id}
        <div class="flex flex-col space-y-1">
          <h3
            class="font-bold font-title mx-auto my-2 text-black text-xs w-full lg:max-w-10/10 dark:text-white"
          >
            Products in this group
          </h3>
          <ProductsList groupId={group.id} />
        </div>
      {/if}
    </div>
    <TemplatePreview
      mockups={group.mockups}
      ignoreGlobalMockups={group.meta?.ignoreGlobalMockups}
      template={getBasicTemplate(group, undefined, {
        html: TEST_TEMPLATE_HTML,
      })}
    />
  </div>
</form>
