<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import type { InferQueryOutput } from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff, url }) => {
    const store = stuff.store!
    const categories = store.categories
    const categorySlug = url.searchParams.get('category')
    const page = url.searchParams.get('page')

    const props = await fetchProducts(
      {
        storeSlug: store.slug,
        search: url.searchParams.get('search') || undefined,
        page: !page || Number.isNaN(+page) ? undefined : +page,
        categoryId: categorySlug
          ? categories?.find((c) => c.slug === categorySlug)?.id
          : undefined,
      },
      fetch
    )
    return {
      stuff,
      props,
    }
  }
</script>

<script lang="ts">
  import Catalog from '$lib/__storefront/products/Catalog.svelte'
  import { page as page_ } from '$app/stores'
  import { createQueryStore } from '$lib'
  import { fetchProducts } from '$lib/__storefront/ProductsWrapper.svelte'

  export let products: InferQueryOutput<'products:list'>['products']
  export let count: InferQueryOutput<'products:list'>['count']

  const search = createQueryStore('search')
  const page = createQueryStore('page')
  const category = createQueryStore('category')

  $: categories = $page_.stuff.store?.categories || []
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
  <Catalog
    page={!$page || Number.isNaN(+$page) ? 1 : +$page}
    {count}
    {products}
    bind:search={$search}
  />
</div>
