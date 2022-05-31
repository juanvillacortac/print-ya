<script lang="ts">
  import { pageSubtitle } from '$lib/stores'

  import ProductEditor from '$lib/__app/product-editor/ProductEditor.svelte'

  $pageSubtitle = 'New product'
</script>

<ProductEditor />
