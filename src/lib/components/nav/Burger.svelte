<script>
  import { hoverable } from '$lib/components/Cursor.svelte'
  export let white = false

  export let open = false

  $: color = white ? 'white' : 'black'
</script>

<button
  use:hoverable={{ primary: true, sticky: true, mul: 4 }}
  aria-label="Menu"
  title="Menu"
  class="border-none cursor-pointer mr-4 z-10 focus:outline-none !dark:text-white"
  class:open
  style:color
  on:click={() => (open = !open)}
>
  <svg width="32" height="32">
    <line id="top" x1="0" y1="11" x2="32" y2="11" />
    <line id="bottom" x1="0" y1="21" x2="32" y2="21" />
  </svg>
</button>

<style windi:global>
  svg {
    min-height: 24px;
    transition: transform 0.2s ease-in-out;
  }

  svg line {
    stroke: currentColor;
    stroke-width: 3;
    transition: transform 0.2s ease-in-out;
  }

  button {
    z-index: 20;
    transition: color 0.2s ease-in-out;
    width: 32px;
    height: 32px;
    cursor: none;
  }

  .open svg {
    transform: scale(0.7) translate(1px, -4px);
  }

  .open #top {
    transform: translate(13px, 1px) rotate(45deg);
  }

  .open #bottom {
    transform: translate(-11px, 16px) rotate(-45deg);
  }
</style>
