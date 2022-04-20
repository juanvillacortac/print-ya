<svelte:options accessors />

<script>
  import { onMount } from 'svelte'

  import { fly } from 'svelte/transition'

  export let title
  export let x = 0
  export let y = 0
  export let width = 0

  let visible = false

  onMount(() => {
    visible = true
  })
</script>

{#if visible}
  <div
    transition:fly={{ y: 2 }}
    class="absolute p-1 bg-white border-gray-200 border dark:border-gray-700 dark:text-white text-xs rounded dark:bg-gray-800 z-20 text-gray-700"
    style="top: {y + 5}px; left: {x + 5}px;"
    bind:clientWidth={width}
  >
    {title}
  </div>
{/if}
