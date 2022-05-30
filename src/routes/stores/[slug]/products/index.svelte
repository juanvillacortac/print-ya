<script lang="ts">
  import { browser } from '$app/env'
  import { goto } from '$app/navigation'

  import { page } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import { squareratio } from '$lib/actions/aspectratio'
  import Preview from '$lib/components/Preview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store, StripedProduct } from '$lib/db'
  import { search } from '$lib/utils/search'
  import { Add32 } from 'carbon-icons-svelte'
  import { flip } from 'svelte/animate'
  import { fly } from 'svelte/transition'
  const store = $page.stuff.store as Store
  const products = $page.stuff.products as StripedProduct[]

  let textSearch = ''
  let categoryId = ''
  let visibility: boolean | '' = true

  $: filteredProducts = search(products, textSearch, ['name'])
    .filter((p) => (categoryId ? p.storeCategoryId === categoryId : true))
    .filter((p) =>
      typeof visibility != 'string' ? p.public == visibility : true
    )

  $pageSubtitle = 'Products'
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products
</h2>
<a
  class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform right-6 bottom-6 z-20 duration-200 fixed hover:scale-95"
  title="Add new product"
  href="products/new"
  use:tooltip
>
  <Add32 />
</a>
<div class="flex mx-auto justify-center items-center lg:w-9/10">
  <div class="flex mb-8 <sm:hidden !text-xs">
    <input
      class="bg-white border rounded-l-full border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
      type="text"
      bind:value={textSearch}
      placeholder="Enter keywords to search..."
    />
    <select
      class="bg-white border-b border-l-0 border-gray-300 leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      bind:value={visibility}
    >
      <option value="">Published and hidden</option>
      <option value={true}>Published</option>
      <option value={false}>Hidden</option>
    </select>
    <select
      class="bg-white border-b rounded-r-full border-l-0 border-gray-300 leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      bind:value={categoryId}
    >
      <option value="">All categories</option>
      {#each store.categories as category}
        <option value={category.id}>{category.name}</option>
      {/each}
    </select>
  </div>
</div>
<div class="mx-auto grid gap-6 grid-cols-1 lg:w-9/10 lg:grid-cols-4">
  {#each filteredProducts as product (product.id)}
    {@const href = `/stores/${store.slug}/products/${product.slug}`}
    <div
      role="link"
      in:fly={{ y: 20 }}
      animate:flip={{ duration: 400 }}
      class="bg-white rounded-xl cursor-pointer flex flex-col h-full space-y-2 shadow w-full p-4 transform duration-400 relative overflow-hidden dark:bg-gray-800 hover:scale-98"
      on:click={() => goto(href)}
      style="will-change: transform"
    >
      <a
        class="rounded-lg bg-gray-100 w-full overflow-hidden select-none dark:bg-gray-700"
        style="aspect-ratio: 1/1"
        use:squareratio
        sveltekit:prefetch
        {href}
      >
        <div
          class="flex h-full w-full items-center justify-center pointer-events-none"
        >
          {#if browser}
            <Preview template={product?.template || {}} fitParent />
          {/if}
        </div>
      </a>
      <p class="font-bold text-sm">
        ${product.price.toLocaleString()}{!product.public
          ? ' - Unpublished'
          : ''}
      </p>
      <a
        class="font-title font-bold text-black dark:text-white"
        sveltekit:prefetch
        {href}
      >
        {product.name}
      </a>
      <div class="flex justify-between items-end">
        <a
          sveltekit:prefetch
          href="/stores/{store.slug}/products?category={product.storeCategory
            .slug}"
          class="text-xs text-blue-500 hover:underline"
          >{product.storeCategory.name}</a
        >
      </div>
    </div>
  {/each}
</div>
