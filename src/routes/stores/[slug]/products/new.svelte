<script lang="ts">
  import { pageSubtitle } from '$lib/stores'

  import ProductEditLayout from '$lib/__layouts/ProductEditLayout.svelte'

  $pageSubtitle = 'New product'
</script>

<ProductEditLayout />
