<script>
  import { page } from '$app/stores'

  import ProductEditor from '$lib/__app/product-editor/ProductEditor.svelte'
</script>

{#if $page.data.product}
  <ProductEditor product={$page.data.product} />
{/if}
