<script lang="ts">
  import { goto } from '$app/navigation'

  import { page } from '$app/stores'
  import { layoutData } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import trpc from '$lib/trpc/client'
  import ProductsList from '$lib/__app/ProductsList.svelte'
  import {
    Checkmark24,
    Close24,
    Warning32,
    WarningAlt32,
  } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal, { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import type { Writable } from 'svelte/store'
  import { fade, scale } from 'svelte/transition'

  const navHeight: Writable<number> = getContext('navHeight')

  let confirmationDialog = false

  const closeDialog = () => {
    confirmationDialog = false
  }
  const approve = async () => {
    await trpc().mutation('shopify:reviewImport', $page.params.importId)
    goto(`/stores/${$layoutData.store?.slug}/products/import`)
  }
</script>

{#if confirmationDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-lg"
    transition:fade={{ duration: 400, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={closeDialog}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-900"
      style="will-change: transform"
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Warning
        </h4>
        <button on:click={closeDialog}><Close24 /></button>
      </div>
      <div class="flex space-x-4 items-center">
        <WarningAlt32 class="h-48px text-yellow-600 w-48px" />
        <div class="flex flex-col space-y-2">
          <p class="font-bold">Do you want to approve all products here?</p>
          <p class="text-sm text-gray-500">
            Your can't restore this action later
          </p>
        </div>
      </div>
      <div class="flex space-x-2 items-center justify-end">
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          on:click={closeDialog}>Cancel</button
        >
        <button
          class="rounded font-bold ml-auto border-2 border-green-500 text-xs py-1 px-2 text-green-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-green-500 not-disabled:hover:text-white"
          on:click={approve}>Approve</button
        >
      </div>
    </div>
  </div>
{/if}

<div class="flex flex-col mx-auto space-y-4 pb-4">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Import # <span
      class="rounded font-mono font-normal bg-gray-200 text-xs leading-none ml-2 p-1 dark:bg-gray-600"
      >{$page.params.importId}</span
    >
  </h3>
</div>

<div class="pb-14">
  <ProductsList importId={$page.params.importId} />
</div>

<Portal>
  <div
    class="< flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
    style:--nh="{$navHeight}px"
  >
    <button
      class="rounded-full flex bg-green-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Approve all"
      on:click={() => (confirmationDialog = true)}
      use:tooltip
    >
      <Checkmark24 />
    </button>
  </div>
</Portal>
