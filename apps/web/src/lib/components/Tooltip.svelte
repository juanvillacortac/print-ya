<svelte:options accessors />

<script>
  import { onMount } from 'svelte'
  import Portal from 'svelte-portal'

  import { fly } from 'svelte/transition'

  export let title
  export let x = 0
  export let y = 0
  export let width = 0
  export let height = 0

  let visible = false
  export let show = true

  onMount(() => {
    visible = true
  })
</script>

{#if visible && show}
  <Portal>
    <div
      transition:fly={{ y: 2 }}
      class="bg-white border rounded border-gray-300 text-xs p-1 text-gray-700 z-20 z-999 absolute pointer-events-none <sm:hidden dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      style="top: {y + 5}px; left: {x + 5}px;"
      bind:clientWidth={width}
      bind:clientHeight={height}
    >
      {title}
    </div>
  </Portal>
{/if}
