<script lang="ts">
  import { page } from '$app/stores'
  import { bag, type BagItem } from '$lib'
  import { get } from '$lib/api'
  import { tooltip } from '$lib/components/tooltip'

  import type { Product } from '$lib/db'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import { Add16, Subtract16, TrashCan16 } from 'carbon-icons-svelte'

  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'

  let mounted = false
  onMount(() => {
    mounted = true
  })
  let products: Record<string, Product>
  $: if (mounted && $page.stuff.store && $bag.length) {
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

  const onChangeQuantity = (
    e: Event & {
      currentTarget?: EventTarget & HTMLInputElement
    },
    p: Product,
    m: ModifiersMap
  ) => {
    bag.setItem(p, m, Math.max(p?.minQuantity || 1, +e.currentTarget.value))
  }

  $: items = $bag.map((v, idx) => ({ ...v, idx }))
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-9/10 lg:px-6"
>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Shopping bag
  </h3>
  {#if items?.length}
    <div class="flex-grow w-full overflow-x-auto">
      <div
        class="divide-y border rounded-lg flex flex-col w-full max-h-60vh relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
      >
        {#each items as item (item.idx)}
          {@const p = products ? products[item.productSlug] : null}
          <div
            class="flex p-4  text-gray-500 justify-between sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
          >
            <div
              class="flex items-center sm:space-x-4 <sm:flex-col <sm:space-y-4"
            >
              <div
                class="rounded-lg bg-gray-100 w-full overflow-hidden pointer-events-none select-none sm:w-42 dark:bg-gray-700"
                style="aspect-ratio: 1/1"
              >
                <div class="flex h-full w-full items-center justify-center">
                  {#if p}
                    <TemplatePreview
                      lazy
                      showFonts
                      template={{
                        ...(p?.template || {}),
                        fields: getTemplateFieldsFromModifiers(
                          p,
                          $bag[item.idx].modifiers
                        ),
                      }}
                      watermark
                      controls={false}
                    />
                  {/if}
                </div>
              </div>
              <div
                class="flex flex-col space-y-1 w-full whitespace-normal sm:w-48"
              >
                <p
                  class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white"
                >
                  {p?.name}
                </p>
              </div>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-xs text-black dark:text-white">Cost</p>
              <p class="font-bold text-sm">
                ${p?.price.toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} / unit
              </p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-xs text-black dark:text-white">
                Aditional cost
              </p>
              <p class="font-bold text-sm">
                ${(p
                  ? getCostFromProductModifiers(p, item.modifiers)
                  : 0
                ).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} / unit
              </p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-xs text-black dark:text-white">
                Quantity
              </p>
              <div class="flex !text-xs">
                <button
                  class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                  on:click={() =>
                    bag.setItem(
                      p,
                      item.modifiers,
                      Math.max(p?.minQuantity || 1, $bag[item.idx].quantity - 1)
                    )}
                >
                  <Subtract16 class="m-auto" />
                </button>
                <input
                  class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-8ch quantity dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
                  type="number"
                  min={Math.max(p?.minQuantity || 1)}
                  value={$bag[item.idx].quantity}
                  on:input={(e) => onChangeQuantity(e, p, item.modifiers)}
                  on:change={(e) => onChangeQuantity(e, p, item.modifiers)}
                />
                <button
                  class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                  on:click={() =>
                    bag.setItem(
                      p,
                      item.modifiers,
                      Math.max(p?.minQuantity || 1, $bag[item.idx].quantity + 1)
                    )}
                >
                  <Add16 class="m-auto" />
                </button>
              </div>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-xs text-black dark:text-white">Total</p>
              <p class="font-bold text-sm">
                ${(p
                  ? getTotalFromProductModifiers(p, item.modifiers) *
                    item.quantity
                  : 0
                ).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} / unit
              </p>
            </div>
            <button
              class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
              title="Delete"
              on:click={() => {
                bag.delete(p, item.modifiers)
              }}
              use:tooltip
              type="button"><TrashCan16 /></button
            >
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div
      class="flex w-full text-gray-500 items-center justify-center dark:text-gray-400"
    >
      <p class="font-bold text-center text-xl">Add items to bag first</p>
    </div>
  {/if}
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
