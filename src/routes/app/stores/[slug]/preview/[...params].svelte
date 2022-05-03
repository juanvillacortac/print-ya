<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const data = await get<StripedProduct[]>(
      `/api/stores/${params.slug}/products`,
      { fetch }
    )
    return {
      props: {
        ...stuff,
        products: data.filter((p) => p.public),
      },
      stuff: {
        ...stuff,
        products: data,
      },
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import type { Store, StripedProduct } from '$lib/db'
  import { Categories16, Category16 } from 'carbon-icons-svelte'
  import Preview from '$lib/components/Preview.svelte'
  let store: Store
  $: store = $page.stuff.store as Store

  export let products: StripedProduct[]
</script>

<div class="min-h-screen bg-gray-100 w-full p-4 dark:bg-gray-900">
  <div class="mx-auto w-full lg:w-[90%]">
    <div
      class="h-[70vh] w-full grid gap-4 grid-cols-1 lg:grid-cols-12 lg:grid-rows-6"
    >
      <div
        class="bg-white rounded-lg flex-col flex h-full shadow w-full overflow-hidden lg:row-span-full lg:col-span-3 dark:bg-gray-800"
      >
        <div
          class="rounded-tl-lg rounded-tr-lg flex space-x-2 bg-blue-500 text-white w-full p-2 items-center"
        >
          <Category16 />
          <h3 class="font-bold text-xs">Categories</h3>
          <a
            href="/app/stores/{store.slug}/preview/products"
            class="flex text-xs hover:underline"
          >
            See all >
          </a>
        </div>
        <div class="flex flex-col h-full space-y-2 p-2">
          {#each store.categories as category}
            <a
              href="/app/stores/{store.slug}/preview/products"
              class="flex space-x-2 text-xs hover:underline"
            >
              <Categories16 />
              <span>
                {category.name}
              </span>
            </a>
          {/each}
        </div>
      </div>
      <div
        class="h-full w-full lg:col-span-full lg:col-start-4 lg:row-end-5 lg:row-start-1"
      >
        <div
          class="bg-cover bg-center rounded-lg flex h-full shadow w-full <lg:h-[40vw]"
          style="background-image: url(https://demo.activeitzone.com/ecommerce/public/uploads/all/0Bf6AZrON13NRpLxc7S6bua38uRBUuiwCH7fN3LG.png)"
        />
      </div>
      <div
        class="w-full grid gap-4 lg:col-span-full lg:row-span-full lg:grid-cols-3 lg:col-start-4 lg:row-start-5"
      >
        {#each products.slice(0, 3) as product (product.id)}
          <a
            class="bg-white rounded-xl flex h-full space-x-4 shadow w-full p-4 transform duration-400 relative overflow-hidden dark:bg-gray-800 hover:scale-95"
            href="/app/stores/{store.slug}/products/{product.slug}"
          >
            <div
              class="rounded-lg h-full bg-gray-100 overflow-hidden pointer-events-none select-none dark:bg-gray-700"
              style="aspect-ratio: 1/1"
            >
              <div class="flex h-full w-full items-center justify-center">
                <Preview
                  template={JSON.parse(product?.template || '{}')}
                  fitParent
                />
              </div>
            </div>
            <div class="flex flex-col space-y-1 justify-end">
              <p class="font-bold text-xs">${product.price.toLocaleString()}</p>
              <h4
                class="font-title font-bold text-sm text-black dark:text-white"
              >
                {product.name}
              </h4>
              <div class="flex justify-between items-end">
                <a
                  href="/app/stores/{store.slug}/products?category={product
                    .storeCategory.slug}"
                  class="text-xs text-blue-500 hover:underline"
                  >{product.storeCategory.name}</a
                >
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>
