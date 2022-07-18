<script lang="ts">
  import { OverflowMenuVertical16, View16 } from 'carbon-icons-svelte'

  export let title = 'Submenu'

  export let from: 'bottom' | 'top' = 'bottom'
</script>

<div class="wrapper relative {from}">
  <slot name="button">
    <button
      class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
      type="button"
    >
      <div class="text-xs">{title}</div>
      <OverflowMenuVertical16 /></button
    >
  </slot>
  <div
    class="transform origin-top-right pt-2 right-0 z-50 translate-0 absolute body !duration-200"
  >
    <div
      class="bg-white border rounded border-gray-300 shadow p-2 dark:bg-gray-800 dark:border-gray-600"
    >
      <slot name="body" />
    </div>
  </div>
</div>

<style>
  .body {
    transition: transform, opacity;
    white-space: nowrap;
    will-change: transform;
  }
  .bottom .body {
    bottom: -100%;
  }

  .top .body {
    top: -100%;
  }

  .wrapper:not(:hover) > .body {
    opacity: 0;
    pointer-events: none;
    @apply -translate-y-2;
  }
</style>
