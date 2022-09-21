<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'
  import {
    Add24,
    CheckboxChecked16,
    CheckmarkFilled32,
    Close16,
    Close24,
    Folder16,
    Folder24,
    TrashCan16,
    TrashCan24,
    Upload24,
  } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal, { portal } from 'svelte-portal'
  import type { Writable } from 'svelte/store'
  import ProductsList from '$lib/__app/ProductsList.svelte'
  import { fade, fly, scale } from 'svelte/transition'
  import { elasticOut, expoOut } from 'svelte/easing'
  import GroupSelector from '$lib/__app/GroupSelector.svelte'
  import type { ProductsGroup } from '@shackcart/db'
  import trpc from '$lib/trpc/client'
  import type { PageData } from './$types'
  import { layoutData } from '$lib'
  import { squareratio } from '$lib/actions/aspectratio'

  const navHeight: Writable<number> = getContext('navHeight')

  let selected: 'all' | string[] | undefined = undefined
  let bulkDialog = false
  let group: ProductsGroup | undefined
  let templateFromGroup = false
  let bindingStatus: 'done' | 'waiting' | undefined
  let refreshList: () => void

  function closeBulkEditor() {
    group = undefined
    bulkDialog = false
    selected = undefined
    templateFromGroup = false
    bindingStatus = undefined
  }

  async function deleteSelectedProducts() {
    if (!$layoutData.store || !selected || selected == 'all') return
    const client = trpc()
    const mutations = selected.map((id) =>
      client.mutation('products:upsert', {
        storeSlug: $layoutData.store!.slug,
        data: {
          id: id,
          archived: true,
        },
      })
    )
    await Promise.all(mutations)
    refreshList()
  }

  async function bindToGroup() {
    if (!$layoutData.store || !group || !selected || selected == 'all') return
    bindingStatus = 'waiting'
    await trpc().mutation('products:groups:bindManyProducts', {
      storeId: $layoutData.store.id,
      groupId: group.id,
      productsIds: selected,
      templateFromGroup,
    })
    bindingStatus = 'done'
    refreshList()
  }
</script>

<div class="flex mb-4 w-full lg:items-center lg:justify-between">
  <h2 class="font-bold font-title text-black text-2xl dark:text-white">
    Products
  </h2>
  <div
    class="flex items-end lg:space-x-2 lg:items-center <lg:flex-col <lg:ml-auto <lg:space-y-2 <lg:mt-1"
  >
    {#if selected}
      <button
        class="border-transparent rounded flex font-bold space-x-1 border-2 border-blue-500 p-1 text-blue-500 duration-200 items-center hover:bg-blue-500 hover:text-white "
        type="button"
        on:click={() => {
          selected = undefined
        }}
      >
        <div class="text-xs">Cancel selection</div>
        <Close16 /></button
      >
      <button
        class="border-transparent rounded flex font-bold space-x-1 border-2 border-red-500 p-1 text-red-500 duration-200 items-center disabled:opacity-50 not-disabled:hover:bg-red-500 not-disabled:hover:text-white"
        type="button"
        disabled={!selected.length}
        on:click={() => {
          deleteSelectedProducts()
        }}
      >
        <div class="text-xs">Delete selected products</div>
        <TrashCan16 /></button
      >
      <button
        class="border-transparent rounded flex font-bold space-x-1 border-2 border-yellow-500 p-1 text-yellow-500 duration-200 items-center disabled:opacity-50 hover:not-disabled:bg-yellow-500 not-disabled:hover:text-white"
        type="button"
        disabled={!selected.length}
        on:click={() => {
          bulkDialog = true
        }}
      >
        <div class="text-xs">Bind products to a group</div>
        <Folder16 /></button
      >
    {:else}
      <button
        class="border-transparent rounded flex font-bold space-x-1 border-2 border-blue-500 p-1 text-blue-500 duration-200 items-center hover:bg-blue-500 hover:text-white "
        type="button"
        on:click={() => {
          selected = []
        }}
      >
        <div class="text-xs">Select products</div>
        <CheckboxChecked16 /></button
      >
    {/if}
  </div>
</div>

{#if selected && selected !== 'all'}
  <div class="font-bold text-right text-xs mb-6 w-full">
    You have selected {selected.length} products
  </div>
{/if}

<Portal>
  <div
    class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
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
    <a
      class="rounded-full flex bg-yellow-600 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Products groups"
      href="products/groups"
      use:tooltip
    >
      <Folder24 />
    </a>
    <a
      class="rounded-full flex bg-green-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Import products from Shopify"
      use:tooltip
      href="products/import"
    >
      <Upload24 />
    </a>
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

<div class="pb-18">
  <ProductsList bind:selection={selected} bind:search={refreshList} />
</div>

{#if bulkDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={closeBulkEditor}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow w-full max-w-9/10 max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-800"
      style="will-change: transform"
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex w-full items-center justify-between">
        <div class="flex space-x-2 items-center">
          <Folder24 />
          <h4
            class="font-bold text-xl text-black leading-thight dark:text-white"
          >
            Bind {selected?.length} products to a group
          </h4>
        </div>
        <button type="button" on:click={closeBulkEditor}><Close24 /></button>
      </div>
      {#if bindingStatus == 'done'}
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
          Products binded to the products group.
        </div>
      {:else}
        <div class="flex flex-col space-y-4 w-full items-center">
          <div class="flex flex-col w-full">
            <div class="font-bold text-xs mb-2 block">Products group</div>
            <GroupSelector bind:group />
          </div>
          <label class="flex font-bold space-x-2 text-xs w-full items-center">
            <input type="checkbox" bind:checked={templateFromGroup} />
            <span>Use groups settings for rendering</span>
          </label>
        </div>
        <div class="flex space-x-2 items-center justify-end">
          <button
            type="button"
            class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
            on:click={closeBulkEditor}>Cancel</button
          >
          <button
            class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
            on:click={bindToGroup}
            disabled={bindingStatus == 'waiting'}
            >{bindingStatus == 'waiting'
              ? 'Binding...'
              : 'Bind products'}</button
          >
        </div>
      {/if}
    </div>
  </div>
{/if}
