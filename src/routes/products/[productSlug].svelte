<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { Product, Store } from '$lib/db'
  import Preview from '$lib/components/Preview.svelte'
  import Markdown from 'svelte-markdown'
  import { Add16, Subtract16 } from 'carbon-icons-svelte'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const store = stuff.store
    const data = await get(
      `/api/stores/${store?.slug}/products/${params.productSlug}`,
      { fetch }
    )
    if (!data)
      return {
        status: 404,
      }
    return {
      props: {
        product: data,
      },
    }
  }
</script>

<script lang="ts">
  export let product: Product
  import { bag } from '$lib'

  let quantity = product.minQuantity || 1

  let modifiers: Record<string, string> = {}

  $: total =
    (Object.entries(modifiers)
      .map(([mId, mValue]) => {
        const modifier = product.modifiers.find((m) => m.id === mId)
        const item = modifier.items.find((i) => i.id === mValue)
        const value = item.percentage
          ? (item.cost / 100) * product.price
          : item.cost
        return value
      })
      .reduce((a, b) => a + b, 0) +
      product.price) *
    quantity

  const addToBag = () => {
    console.log(modifiers, $bag)
    const elementIdx = $bag.findIndex(
      (p) =>
        p.productSlug == product.slug &&
        JSON.stringify(modifiers) === JSON.stringify(p.modifiers)
    )
    if (elementIdx >= 0) {
      $bag[elementIdx].quantity += quantity
      return
    }
    $bag = [
      ...$bag,
      {
        productSlug: product.slug,
        modifiers,
        quantity,
      },
    ]
  }
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-7/10 lg:px-6"
>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col" />
  <div class="grid gap-4 grid-cols-1 items-start lg:grid-cols-2">
    {#if product.template && product.type === 'template'}
      <div class="flex h-full relative items-start">
        <div
          class="border rounded-lg h-auto border-gray-300 w-full top-0 col-span-1 sticky overflow-hidden pointer-events-none  select-none  dark:border-gray-800"
          style="aspect-ratio: 1/1"
        >
          <div
            class="flex h-full w-full items-center justify-center checkerboard"
          >
            <Preview template={product?.template} fitParent />
          </div>
        </div>
      </div>
    {/if}
    <div class="flex flex-col space-y-4">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
        <a
          href=".?category={product.storeCategory.slug}"
          class="text-xs text-blue-500 hover:underline"
          >{product.storeCategory.name}</a
        >
      </div>
      <div class="flex flex-col space-y-4">
        <p class="font-bold text-black text-4xl <lg:hidden dark:text-white">
          ${product.price.toLocaleString()}
          <span class="text-lg">/ unit</span>
        </p>
        <div class="flex flex-col space-y-4 lg:self-start">
          {#each product.modifiers as m}
            <div
              class="flex space-x-4 items-center justify-end lg:justify-between"
            >
              <div
                class="font-bold font-title text-black text-xs dark:text-white"
              >
                {m.name}
              </div>
              {#if m.type === 'select'}
                <select
                  class="bg-white border rounded border-gray-300 text-xs leading-tight py-2 px-3 w-1/2 appearance-none !pr-8 lg:w-60 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                  bind:value={modifiers[m.id]}
                >
                  {#each m.items as i}
                    <option value={i.id}
                      >{i.name}&nbsp;&nbsp;&ndash;&nbsp;&nbsp;<strong
                        >{i.cost < 0 ? '-' : ''}{!i.percentage
                          ? '$'
                          : ''}{Math.abs(i.cost)}{i.percentage
                          ? '%'
                          : ''}</strong
                      ></option
                    >
                  {/each}
                </select>
              {/if}
            </div>
          {/each}
        </div>
        <div class="flex space-x-2 items-center">
          <div class="font-bold font-title text-black text-xs dark:text-white">
            Quantity{product.minQuantity
              ? ` (min ${product.minQuantity} per order)`
              : ''}
          </div>
          <div class="flex !text-xs">
            <button
              class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
              on:click={() =>
                (quantity = Math.max(product.minQuantity || 1, quantity - 1))}
            >
              <Subtract16 class="m-auto" />
            </button>
            <input
              class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-6ch quantity dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
              type="number"
              min={Math.max(product.minQuantity || 1)}
              bind:value={quantity}
            />
            <button
              class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
              on:click={() => quantity++}
            >
              <Add16 class="m-auto" />
            </button>
          </div>
        </div>
        <div class="flex space-x-4 items-center">
          <button
            class="rounded-lg font-bold mr-auto bg-blue-500 shadow text-white text-xs py-2 px-3 transform duration-200 hover:scale-105"
            on:click={addToBag}>Add to basket</button
          >
          <div class="font-bold text-lg text-black dark:text-white">
            Total ${total.toLocaleString()}
          </div>
        </div>
        <div class="border-t pt-2 prose-sm !w-full dark:border-gray-600">
          <Markdown source={product.description || 'No description'} />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .checkerboard {
    --black-cell: rgba(55, 65, 81, 0.2);
    background-image: linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      ),
      linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      );
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
  }
  :global(.dark) .checkerboard {
    --black-cell: rgba(55, 65, 81, 0.5);
    background-color: rgba(80, 80, 80, 0.2);
  }
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
  }
</style>
