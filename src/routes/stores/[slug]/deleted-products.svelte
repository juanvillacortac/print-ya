<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc, { invalidateQuery } from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const { products } = await trpc(fetch).query('products:listDeleted', {
      storeSlug: params.slug,
    })
    return {
      props: {
        products,
      },
      stuff,
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import type { Store, StripedProduct } from '$lib/db'
  import { search } from '$lib/utils/search'
  import { fly, slide } from 'svelte/transition'
  import { Redo16, View16, Warning32 } from 'carbon-icons-svelte'
  import Ufo from '$lib/components/__Ufo.svelte'
  import { expoOut } from 'svelte/easing'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { getBasicTemplate } from '$lib/utils/modifiers'
  import ProductsList from '$lib/__app/ProductsList.svelte'
  const store = $page.stuff.store as Store | null
  export let products: StripedProduct[] = []

  let textSearch = ''
  let categoryId = ''

  $: filteredProducts = search(products, textSearch, ['name']).filter((p) =>
    categoryId ? p.storeCategoryId === categoryId : true
  )

  $pageSubtitle = 'Deleted products'
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Deleted products
</h2>
<div
  class="border-dashed rounded-lg flex space-x-4 bg-red-500 bg-opacity-20 border-2 border-red-500 mb-6 p-4 items-center"
>
  <Warning32 class="text-red-500" />
  <p class="m-auto text-xs">
    <span class="font-bold">Advice:</span> products listed here will be removed after
    30 days of being added.
  </p>
</div>

<ProductsList archived />
