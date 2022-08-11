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
  import { Search16 } from 'carbon-icons-svelte'
  import { writable } from 'svelte/store'
  import Searchbar from '$lib/__storefront/Searchbar.svelte'

  export let products: InferQueryOutput<'products:list'>['products']
  export let count: InferQueryOutput<'products:list'>['count']

  const search = createQueryStore('search')
  const page = createQueryStore('page')
  const category = createQueryStore('category')

  const search404 = writable('')
  const category404 = writable('')

  $: onSearch404 = () => {
    $page = ''
    $search = $search404 || ''
    $category = $category404 || ''
    $search404 = ''
    $category404 = ''
  }

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
  {#if products?.length}
    <Catalog
      page={!$page || Number.isNaN(+$page) ? 1 : +$page}
      {count}
      {products}
      on:search={(e) => {
        $search = e.detail
      }}
    />
  {:else}
    <div class="flex flex-col">
      <h3
        class="flex font-bold font-title text-red-900 text-6xl items-center dark:text-white"
      >
        Whoops!
      </h3>
      <p class="text-dark-900 text-2xl dark:text-white">
        We can't find the page you requested (sorry)...
      </p>
    </div>
    <p class="font-bold text-red-900 text-2xl dark:text-white">
      Send us an email with what you're looking for and we'll add it in for you!
      <a
        href="/contact"
        class="font-bold text-dark-900 duration-400 uppercase dark:text-white dark:text-red-500 hover:text-red-500 dark:hover:text-white"
        >Contact us</a
      >
    </p>
    <div class="flex flex-col space-y-12 pt-12">
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4 items-center">
          <div
            class="rounded-full flex font-bold font-title bg-red-900 h-12  text-white text-lg w-12 items-center justify-center"
          >
            1
          </div>
          <p class="text-lg">
            <span class="font-bold">Search</span> for it...
          </p>
        </div>
        <Searchbar />
      </div>
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4">
          <div
            class="rounded-full flex font-bold font-title bg-red-900 text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
          >
            2
          </div>
          <p class="text-lg pt-3">
            <span class="font-bold">If you typed in a URL...</span>
            make sure the spelling, cApitALiZaTiOn, and punctuation are correct.
            Then try reloading the page.
          </p>
        </div>
      </div>
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4">
          <div
            class="rounded-full flex font-bold font-title bg-red-900 text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
          >
            3
          </div>
          <p class="text-lg pt-3">
            <span class="font-bold"
              >Search using one of the collections below:</span
            >
          </p>
        </div>
        <div class="w-full grid gap-6 sm:grid-cols-2 lg:px-16 lg:grid-cols-4">
          {#each $page_.stuff.store?.categories || [] as c}
            <a
              href="/products?category={c.slug}"
              class="flex flex-col space-y-4 duration-200 hover:text-red-500"
              sveltekit:prefetch
            >
              <div
                class="bg-black flex font-bold font-title text-white text-center w-full p-6 text-3xl aspect-square items-center justify-center"
              >
                {c.name}
              </div>
              <div class="font-bold text-center">{c.name}</div>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
