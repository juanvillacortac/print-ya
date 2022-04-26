<svelte:options accessors />

<script>
  import { onMount } from 'svelte'

  import { fly } from 'svelte/transition'

  export let title
  export let x = 0
  export let y = 0
  export let width = 0
  export let height = 0

  let visible = false

  onMount(() => {
    visible = true
  })
</script>

{#if visible}
  <div
    transition:fly={{ y: 2 }}
    class="bg-white border rounded border-gray-200 text-xs p-1 text-gray-700 z-20 z-999 absolute dark:bg-gray-800 dark:border-gray-700 dark:text-white pointer-events-none"
    style="top: {y + 5}px; left: {x + 5}px;"
    bind:clientWidth={width}
    bind:clientHeight={height}
  >
    {title}
  </div>
{/if}
