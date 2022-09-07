<script lang="ts">
  import { goto } from '$app/navigation'
  import { layoutData } from '$lib/stores'
  import trpc from '$lib/trpc/client'
  import { Search16 } from 'carbon-icons-svelte'

  let search = ''
  let category = ''

  async function submitSearch() {
    await goto(getSearchUrl())
    if (search && category) {
      trpc().mutation('analytics:searchHistory:create', {
        storeId: $layoutData.store!.id,
        searchTerm: search,
      })
    }
    search = ''
    category = ''
  }

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
    class="bg-white border border-$sc-color-primary  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
    type="search"
    name="q"
    bind:value={search}
    placeholder="Enter keywords to search..."
  />
  <select
    class="bg-white border-b border-$sc-color-primary border-l-0 border-r-0 leading-tight w-full  py-2 px-3 appearance-none sm:w-10rem !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
    bind:value={category}
  >
    <option value="">All products</option>
    {#each $layoutData.store?.categories || [] as category}
      <option value={category.id}>{category.name}</option>
    {/each}
  </select>
  <button
    class="bg-$sc-color-primary flex  text-$sc-auto-foreground p-2 items-center"
  >
    <Search16 class="m-auto" />
  </button>
</form>
