<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const store = stuff.store!
    const { products } = await trpc(fetch).query('products:list', {
      storeSlug: store.slug,
    })
    return {
      stuff: { ...stuff, products },
    }
  }
</script>

<script lang="ts">
  import Catalog from '$lib/__storefront/products/Catalog.svelte'
  import { page } from '$app/stores'
  import { createQueryStore } from '$lib'

  $: products = $page.stuff.products || []
  const search = createQueryStore('search')
  const category = createQueryStore('category')

  $: categories = $page.stuff.store?.categories || []
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href="/products" class="hover:underline">Products</a>
    <span>/</span>
    <p>
      {$category ? categories.find((c) => c.slug === $category)?.name : 'All'}
    </p>
  </div>
  <Catalog {products} bind:search={$search} bind:category={$category} />
</div>
