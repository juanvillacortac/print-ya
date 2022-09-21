<script>
  import ProductsGroupEditor from '$lib/__app/product-editor/ProductsGroupEditor.svelte'

  /** @type {import('./$types').PageData} */
  export let data
</script>

<ProductsGroupEditor group={data.group} />
