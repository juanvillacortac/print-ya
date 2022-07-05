<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'

  import ProductEditor from '$lib/__app/product-editor/ProductEditor.svelte'

  $: product = $page.stuff.product
  $pageSubtitle = product?.name
</script>

{#if product}
  <ProductEditor {product} />
{/if}
