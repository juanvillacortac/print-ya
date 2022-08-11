<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import trpc from '$lib/trpc/client'
  import { Search16 } from 'carbon-icons-svelte'

  let search = ''
  let category = ''

  async function submitSearch() {
    await goto(getSearchUrl())
    trpc().mutation('analytics:searchHistory:create', {
      storeId: $page.stuff.store!.id,
      searchTerm: search,
      categorySlug: category || undefined,
    })
    search = ''
    category = ''
  }

  $: store = $page.stuff.store

  $: getSearchUrl = () => {
    const query = new URLSearchParams()
    query.set('search', search)
    query.set('category', category)
    return `/products?${query.toString()}`
  }
</script>

<form
  class="flex py-2 !text-xs {$$restProps.class}"
  on:submit|preventDefault={submitSearch}
>
  <input
    class="bg-white border border-red-900  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
    type="search"
    name="q"
    bind:value={search}
    placeholder="Enter keywords to search..."
  />
  <select
    class="bg-white border-b border-l-0 border-r-0 border-red-900  leading-tight w-full  py-2 px-3 appearance-none sm:w-10rem !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
    bind:value={category}
  >
    <option value="">All products</option>
    {#each store?.categories || [] as category}
      <option value={category.slug}>{category.name}</option>
    {/each}
  </select>
  <button class="flex bg-red-900  text-white p-2 items-center">
    <Search16 class="m-auto" />
  </button>
</form>
