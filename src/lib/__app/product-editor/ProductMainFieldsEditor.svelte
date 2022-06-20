<script lang="ts">
  import { page } from '$app/stores'
  import { tooltip } from '$lib/components/tooltip'

  import type { Product } from '$lib/db'
  import { Editor } from 'bytemd'
  import { ChevronRight16 } from 'carbon-icons-svelte'
  import { expoOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'

  export let product: Partial<Product>
  $: store = $page.stuff.store
  let showing = false
</script>

<div
  class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
>
  <div class="flex w-full justify-between items-center">
    <div class="flex space-x-4 items-center">
      <button
        class="rounded flex p-1 duration-200"
        title="Show/hide items"
        use:tooltip
        on:click={() => (showing = !showing)}
        type="button"
        ><ChevronRight16
          class="transform duration-200 transition-transform {showing
            ? 'rotate-90'
            : ''}"
        /></button
      >
      <h3 class="font-bold text-xs block">Product fields</h3>
    </div>
  </div>
  {#if showing}
    <div
      class="flex flex-col space-y-4 <lg:pb-12"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="grid gap-4 grid-cols-1 lg:grid-cols-3">
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
            {#each store?.categories || [] as category}
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
  {/if}
</div>
