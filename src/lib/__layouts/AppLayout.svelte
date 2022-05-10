<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
</script>

<svelte:head>
  <title>Print Ya!</title>
</svelte:head>

<Favicons favicon="/images/logo.svg" themeColor="#000" titleName="Print Ya!" />

<div class=" relative">
  <slot />
</div>
