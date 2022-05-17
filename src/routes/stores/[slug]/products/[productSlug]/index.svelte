<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'

  import ProductEditLayout from '$lib/__layouts/ProductEditLayout.svelte'

  let product = $page.stuff.product
  $pageSubtitle = product.name
</script>

<ProductEditLayout {product} />
