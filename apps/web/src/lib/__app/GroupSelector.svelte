<script>
  import { Close16, Close24, Folder16 } from 'carbon-icons-svelte'
  import { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import { fade, fly } from 'svelte/transition'
  import { createEventDispatcher } from 'svelte'
  import ProductsGroupsList from './ProductsGroupsList.svelte'
  import { tooltip } from '$lib/components/tooltip'

  /** @typedef {import('@shackcart/db').ProductsGroup} ProductsGroup */

  let groupDialog = false

  /** @type {typeof createEventDispatcher<{ select: ProductsGroup, remove: never }>} */
  const createDispatcher = createEventDispatcher
  const dispatcher = createDispatcher()

  /** @param {ProductsGroup} element */
  function onSelect(element) {
    dispatcher('select', element)
    group = element
    groupDialog = false
  }

  function onRemove() {
    dispatcher('remove')
    group = null
  }

  /** @type {ProductsGroup | undefined | null} */
  export let group
</script>

<div
  class="bg-white border rounded cursor-pointer flex border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none relative dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
  on:click={() => (groupDialog = true)}
>
  <div class="flex space-x-2 w-full items-center justify-between">
    <div class="flex space-x-2 w-full items-center">
      <Folder16 class="opacity-50" />
      <div
        class="text-xs max-w-20ch px-1 overflow-hidden whitespace-nowrap overflow-ellipsis"
        class:rounded={group}
        class:bg-gray-200={group}
        class:dark:bg-gray-500={group}
        class:py-px={group}
        class:-my-px={group}
        class:italic={!group}
        class:opacity-50={!group}
      >
        {group?.name || 'Bind to a group...'}
      </div>
    </div>
    {#if group}
      <button
        type="button"
        class="justify-self-end"
        title="Remove group"
        use:tooltip
        on:click|preventDefault|stopPropagation={() => {
          onRemove()
        }}
      >
        <Close16 class="flex" />
      </button>
    {/if}
  </div>
</div>

{#if groupDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => (groupDialog = false)}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow w-full max-w-9/10 max-h-9/10 p-4 relative lg:max-w-5/10 dark:bg-gray-800"
      style="will-change: transform"
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex w-full items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Select a group
        </h4>
        <button type="button" on:click={() => (groupDialog = false)}
          ><Close24 /></button
        >
      </div>
      <div class="flex flex-col space-x-4 w-full items-center">
        <ProductsGroupsList
          selection
          on:select={({ detail: { group } }) => {
            onSelect(group)
          }}
        />
      </div>
    </div>
  </div>
{/if}
