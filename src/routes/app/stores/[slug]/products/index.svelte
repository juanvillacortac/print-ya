<script lang="ts">
  import { page } from '$app/stores'
  import Preview from '$lib/components/Preview.svelte'
  import type { Store, StripedProduct } from '$lib/db'
  const store = $page.stuff.store as Store
  const products = $page.stuff.products as StripedProduct[]
</script>

<div class="mx-auto grid gap-6 grid-cols-1 lg:w-9/10 lg:grid-cols-4">
  {#each products as product}
    <a
      class="bg-white rounded-xl flex flex-col h-full space-y-2 shadow w-full p-4 transform duration-400 relative overflow-hidden dark:bg-gray-800 hover:scale-95"
      href="/app/stores/{store.slug}/products/{product.slug}/ide"
    >
      <div
        class="rounded-lg bg-gray-100 w-full overflow-hidden pointer-events-none select-none dark:bg-gray-700"
        style="aspect-ratio: 1/1"
      >
        <div class="flex h-full w-full items-center justify-center">
          <Preview template={JSON.parse(product.template)} fitParent />
        </div>
      </div>
      <h4 class="font-title font-bold text-black dark:text-white">
        {product.name}
      </h4>
      <a
        href="/app/stores/{store.slug}/products?category={product.storeCategory
          .name}"
        class="text-xs text-blue-500 hover:underline"
        >{product.storeCategory.name}</a
      >
    </a>
  {/each}
</div>
