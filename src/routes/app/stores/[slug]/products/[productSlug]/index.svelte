<script lang="ts">
  import { page } from '$app/stores'

  import ProductEditLayout from '$lib/__layouts/ProductEditLayout.svelte'

  let product = $page.stuff.product
</script>

<ProductEditLayout {product} />
