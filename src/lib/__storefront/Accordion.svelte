<svelte:options accessors />

<script lang="ts">
  import 'virtual:windi.css'
  import { slide } from 'svelte/transition'
  import { ChevronDown24 } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'

  export let title: string
  export let html: string | undefined = undefined

  let open = false
</script>

<div class="rounded flex-col flex w-full overflow-hidden">
  <button
    title="View information"
    class="flex font-bold font-title bg-red-900 shadow-sm text-white w-full p-2 z-20 justify-between items-center"
    on:click={() => (open = !open)}
    use:tooltip
  >
    <h4 class="text-sm">{title}</h4>
    <ChevronDown24 class="transform duration-400 {open ? 'rotate-180' : ''}" />
  </button>
  {#if open}
    <div class="bg-gray-100 p-2 dark:bg-gray-700" transition:slide>
      {@html html || ''}
    </div>
  {/if}
</div>
