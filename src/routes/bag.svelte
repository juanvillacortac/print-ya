<script lang="ts">
  import { page } from '$app/stores'
  import { bag, type BagItem } from '$lib'
  import { get } from '$lib/api'
  import Preview from '$lib/components/Preview.svelte'
  import { tooltip } from '$lib/components/tooltip'

  import type { Product } from '$lib/db'
  import {
    Add16,
    Information16,
    Subtract16,
    TrashCan16,
  } from 'carbon-icons-svelte'

  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'

  let mounted = false
  onMount(() => {
    mounted = true
  })
  let products: Record<string, Product>
  $: if (mounted && $page.stuff.store) {
    loadProducts()
  }

  $: getModifiers = (element: BagItem) =>
    Object.entries(element.modifiers).map(([mId, mValue]) => {
      const product = products ? products[element.productSlug] : null
      if (!product) return ''
      const modifier = product.modifiers.find((m) => m.id === mId)
      const item = modifier.items.find((i) => i.id === mValue)
      return item.name
    })
  $: getAdditionalCost = (element: BagItem) =>
    Object.entries(element.modifiers)
      .map(([mId, mValue]) => {
        const product = products ? products[element.productSlug] : null
        if (!product) return 0
        const modifier = product.modifiers.find((m) => m.id === mId)
        const item = modifier.items.find((i) => i.id === mValue)
        const value = item.percentage
          ? (item.cost / 100) * product.price
          : item.cost
        return value
      })
      .reduce((a, b) => a + b, 0)

  const loadProducts = () => {
    if (!$bag.length) {
      products = {}
      return
    }
    const promises = [...new Set($bag.map((p) => p.productSlug))].map((p) =>
      get<Product>(`/api/stores/${$page.stuff.store?.slug}/products/${p}`)
    )
    Promise.all(promises).then(
      (p) =>
        (products = p.reduce(
          (a, v) => ({
            ...a,
            [v.slug]: v,
          }),
          {}
        ))
    )
  }
  $: console.log(products)
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-7/10 lg:px-6"
>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Shopping bag
  </h3>
  <div class="flex-grow w-full overflow-x-auto">
    <div
      class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
    >
      <table class="text-sm text-left w-full text-gray-500 dark:text-gray-400">
        <thead
          class="bg-gray-50 text-xs text-gray-700 uppercase !z-30 dark:bg-gray-700 dark:text-gray-400"
          class:sr-only={!$bag.length}
        >
          <tr>
            <th scope="col" class="py-3 px-6" class:sr-only={!$bag.length}
              >Item</th
            >
            <th scope="col" class="py-3 px-6" class:sr-only={!$bag.length}
              >Cost</th
            >
            <th scope="col" class="py-3 px-6" class:sr-only={!$bag.length}
              >Additional cost</th
            >
            <th scope="col" class="py-3 px-6" class:sr-only={!$bag.length}
              >Quantity</th
            >
            <th scope="col" class="py-3 px-6" class:sr-only={!$bag.length}
              >Total</th
            >
            <th scope="col" class="py-3 px-6">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="z-10 relative">
          {#each $bag as i, idx (idx)}
            {@const p = products ? products[i.productSlug] : null}
            <tr
              in:fly|local={{ x: -20 }}
              class="bg-white dark:bg-gray-800"
              class:border-b={idx !== $bag?.length - 1}
              class:dark:border-gray-700={idx !== $bag.length - 1}
            >
              <th
                scope="row"
                class="flex font-bold space-x-4 p-4 text-gray-900 whitespace-nowrap items-center dark:text-white"
              >
                <div
                  class="rounded-lg bg-gray-100 w-auto w-32 overflow-hidden pointer-events-none select-none dark:bg-gray-700"
                  style="aspect-ratio: 1/1"
                >
                  <div class="flex h-full w-full items-center justify-center">
                    <Preview template={p?.template || {}} fitParent />
                  </div>
                </div>
                <div class="flex flex-col space-y-1">
                  <p class="font-bold text-sm">{p?.name}</p>
                  <p class="font-bold text-xs text-gray-400">
                    {getModifiers(i).join(' / ')}
                  </p>
                </div>
              </th>

              <td class="py-4 px-6">
                <p class="font-bold text-sm">
                  ${p?.price.toLocaleString()} / unit
                </p>
              </td>
              <td class="py-4 px-6">
                <p class="font-bold text-sm">
                  ${getAdditionalCost(i)} / unit
                </p>
              </td>
              <td class="py-4 px-6">
                <div class="flex !text-xs">
                  <button
                    class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                    on:click={() =>
                      (i.quantity = Math.max(
                        p?.minQuantity || 1,
                        i.quantity - 1
                      ))}
                  >
                    <Subtract16 class="m-auto" />
                  </button>
                  <input
                    class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-8ch quantity dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
                    type="number"
                    min={Math.max(p?.minQuantity || 1)}
                    bind:value={i.quantity}
                  />
                  <button
                    class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                    on:click={() => i.quantity++}
                  >
                    <Add16 class="m-auto" />
                  </button>
                </div>
              </td>
              <td class="py-4 px-6">
                <p class="font-bold text-sm">
                  ${(
                    (p?.price + getAdditionalCost(i)) *
                    i.quantity
                  ).toLocaleString()}
                </p>
              </td>
              <td class="text-right py-4 px-6">
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Delete"
                  on:click={() => {
                    $bag.splice(idx, 1)
                    $bag = $bag
                  }}
                  use:tooltip
                  type="button"><TrashCan16 /></button
                >
              </td>
            </tr>
          {:else}
            <tr
              class="bg-gray-50 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            >
              <td class="text-center py-4 px-6" colspan="5">
                <div class="flex space-x-2 w-full justify-center items-center">
                  <Information16 />
                  <p class="font-bold text-xs whitespace-nowrap">
                    No products added
                  </p>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
  }
</style>
