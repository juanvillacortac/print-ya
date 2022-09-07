<script>
  import { browser } from '$app/environment'
  import { page } from '$app/stores'

  import ProductEditor from '$lib/__app/product-editor/ProductEditor.svelte'
</script>

{#if $page.data.product && browser}
  <ProductEditor product={$page.data.product} />
{/if}
