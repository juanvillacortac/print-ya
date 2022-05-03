<script lang="ts">
  import { page } from '$app/stores'
  import type { Product } from '$lib/db'

  import ProductEditLayout from '$lib/__layouts/ProductEditLayout.svelte'

  let product = $page.stuff.product as Product
</script>

<ProductEditLayout {product} />
