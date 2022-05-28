<script lang="ts">
  import 'bytemd/dist/index.css'
  import { AddAlt16, ChevronRight16, Information16 } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Product } from '$lib/db'
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  export let product: Partial<Product>

  let expanded = false
</script>

<div
  class="bg-white rounded-xl flex flex-col h-full space-y-4 shadow w-full p-4 relative overflow-hidden dark:bg-gray-800"
>
  <div class="flex w-full justify-between items-center">
    <div class="flex space-x-4 items-center">
      <button
        class="rounded flex p-1 duration-200"
        title="Show/hide items"
        use:tooltip
        on:click={() => (expanded = !expanded)}
        type="button"
        ><ChevronRight16
          class="transform duration-200 transition-transform {expanded
            ? 'rotate-90'
            : ''}"
        /></button
      >
      <h3 class="font-bold text-xs block">Mockup images</h3>
    </div>
    <div class="flex space-x-1">
      <button
        class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
        title="Add image"
        type="button"
        use:tooltip
      >
        <AddAlt16 class="font-bold" />
      </button>
    </div>
  </div>
  {#if expanded}
    <div
      class="flex w-full"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div
        class="border rounded-lg bg-gray-50 text-xs w-full text-gray-500 dark:bg-gray-700 dark:border-gray-700 dark:text-gray-400"
      >
        <div class="text-center w-full py-4 px-6">
          <div class="flex space-x-2 w-full justify-center items-center">
            <Information16 />
            <p class="font-bold text-xs whitespace-nowrap">Upload a image</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
