<script lang="ts">
  import { fly } from 'svelte/transition'

  export let pageTransitionDuration = 400
  export let url: string
</script>

{#key url}
  <div
    in:fly={{
      x: -5,
      duration: pageTransitionDuration,
    }}
  >
    <slot />
  </div>
{/key}
