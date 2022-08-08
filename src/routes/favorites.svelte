<script lang="ts">
  import Catalog from '$lib/__storefront/products/Catalog.svelte'
  import { page } from '$app/stores'
  import { createQueryStore, favorites } from '$lib'
  import { onMount } from 'svelte'
  import type { StripedProduct } from '$lib/db'
  import trpc from '$lib/trpc/client'
  import { search as s } from '$lib/utils/search'

  const search = createQueryStore('search')
  const pageNumber = createQueryStore('page')
  const category = createQueryStore('category')

  onMount(() => {
    const unsuscribe = favorites.subscribe((f) => {
      if (!$page.stuff.store) return
      loadProducts(f.items())
    })
    return () => {
      unsuscribe()
    }
  })
  let products: StripedProduct[] = []

  const loadProducts = (items: string[]) => {
    if (!items.length) {
      products = []
      return
    }
    let client = trpc()
    const promises = [...new Set(items)].map((productId) =>
      client.query('products:getById', productId)
    )
    return Promise.all(promises).then(
      (p) => (products = p.filter((p) => p!).map((p) => p!))
    )
  }

  $: categories = $page.stuff.store?.categories || []

  function paginate(array, page_size, page_number) {
    // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
    return array.slice((page_number - 1) * page_size, page_number * page_size)
  }

  $: filteredProducts = s(products, $search || '', ['name']).filter((p) =>
    $category ? p.storeCategory?.slug === $category : true
  )
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href="/products" class="hover:underline">Favorites</a>
    <span>/</span>
    <p>
      {$category ? categories.find((c) => c.slug === $category)?.name : 'All'}
    </p>
  </div>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Favorites
  </h3>
  <Catalog
    products={paginate(
      filteredProducts,
      20,
      !$pageNumber || Number.isNaN(+$pageNumber) ? 1 : +$pageNumber
    )}
    count={filteredProducts.length}
    page={1}
    on:search={(e) => {
      $search = e.detail
    }}
  />
</div>
