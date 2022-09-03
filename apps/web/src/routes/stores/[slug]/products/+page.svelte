<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'
  import { Add24, TrashCan24, Upload24 } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal from 'svelte-portal'
  import type { Writable } from 'svelte/store'
  import ProductsList from '$lib/__app/ProductsList.svelte'

  const navHeight: Writable<number> = getContext('navHeight')
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products
</h2>

<Portal>
  <div
    class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
    style:--nh="{$navHeight}px"
  >
    <a
      class="rounded-full flex bg-red-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Deleted products"
      href="deleted-products"
      use:tooltip
    >
      <TrashCan24 />
    </a>
    <a
      class="rounded-full flex bg-green-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Import products from Shopify"
      use:tooltip
      href="products/import"
    >
      <Upload24 />
    </a>
    <a
      class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Add new product"
      href="products/new"
      use:tooltip
    >
      <Add24 />
    </a>
  </div>
</Portal>

<div class="pb-14">
  <ProductsList />
</div>
