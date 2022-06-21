<script lang="ts">
  import { page } from '$app/stores'
  import { bag, preferences, type BagItem } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import type { Product } from '$lib/db'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import {
    Add16,
    ArrowRight24,
    Subtract16,
    TrashCan16,
    View16,
  } from 'carbon-icons-svelte'

  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { expoOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'
  import trpc from '$lib/trpc/client'
  import CheckoutSidebar from '$lib/__storefront/CheckoutSidebar.svelte'
  import BagItemDetails from '$lib/__storefront/BagItemDetails.svelte'

  let mounted = false
  onMount(() => {
    mounted = true
  })
  let products: Record<string, Product>
  $: if (mounted && $page.stuff.store && $bag.length) {
    loadProducts()
  }

  const loadProducts = () => {
    if (!$bag.length) {
      products = {}
      return
    }
    let client = trpc()
    const promises = [...new Set($bag.map((p) => p.productSlug))].map(
      (productSlug) =>
        client.query('products:getBySlug', {
          productSlug,
          storeSlug: $page.stuff.store?.slug!,
        })
    )
    Promise.all(promises).then(
      (p) =>
        (products = p.reduce(
          (a, v) => ({
            ...a,
            [v!.slug]: v,
          }),
          {}
        ))
    )
  }

  const onChangeQuantity = (
    e: Event & {
      currentTarget?: EventTarget & HTMLInputElement
    },
    p: Product | null,
    m: ModifiersMap
  ) => {
    if (p) {
      bag.setItem(p, m, Math.max(p?.minQuantity || 1, +e.currentTarget.value))
    }
  }

  let checkout = false

  $: items = $bag.map((v, idx) => ({ ...v, idx }))

  $: total = $bag
    .map((v) => ({
      product: products ? products[v.productSlug] : null,
      modifiers: v.modifiers,
      quantity: v.quantity,
    }))
    .map(({ product, modifiers, quantity }) =>
      product ? getTotalFromProductModifiers(product, modifiers) * quantity : 0
    )
    .reduce((a, b) => a + b, 0)

  let details: BagItem | undefined

  let fonts: { name: string; url: string }[] = []

  $: if (details && products[details?.productSlug]) {
    const p = products[details.productSlug]
    fonts = Object.entries(details.modifiers || {})
      .map(([mId, m]) => ({
        modifier: m.modifier || p?.modifiers?.find((m) => m.id == mId),
        item: (
          m?.modifier || p?.modifiers?.find((m) => m.id == mId)
        )?.items?.find((i) => i.id === m.itemId),
      }))
      .filter(({ modifier }) => modifier?.type === 'font')
      .filter(({ item }) => item?.name)
      .map(({ item }) => ({
        name: item?.name || '',
        url: item?.meta?.web
          ? (item?.meta?.url as string)
          : `/api/fontface?name=${encodeURIComponent(
              item?.name || ''
            )}&src=${encodeURIComponent(item?.meta?.url)}`,
      }))
  }

  $: console.log(Object.entries(details?.modifiers || {}))
</script>

<svelte:head>
  {#each fonts as f}
    <link href={f.url} rel="stylesheet" />
  {/each}
</svelte:head>

{#if $page.stuff.store}
  <BagItemDetails bind:item={details} store={$page.stuff.store} />
{/if}

<CheckoutSidebar
  on:checkout={bag.clear}
  bind:open={checkout}
  dark={$preferences.darkMode}
  {total}
/>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-9/10 lg:px-6"
  class:pointer-events-none={checkout}
>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Shopping bag
  </h3>
  <div class="flex flex-grow flex-col h-full space-y-4 w-full">
    {#if items?.length}
      <div
        class="flex-grow w-full overflow-x-auto"
        transition:slide|local={{ duration: 400, easing: expoOut }}
      >
        <div
          class="divide-y border rounded-lg flex flex-col w-full max-h-50vh relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
        >
          {#each items as item (item.key)}
            {@const p = products ? products[item.productSlug] : null}
            <div class="relative">
              <div
                class="flex p-4 text-gray-500 justify-between relative sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
                class:skeleton={!p}
                class:pointer-events-none={!p}
                transition:slide|local={{ duration: 400, easing: expoOut }}
              >
                <div
                  class="flex items-center sm:space-x-4 <lg:flex-col <lg:space-y-4"
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
                    <a
                      href="/products/{p?.slug}"
                      class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white hover:underline"
                    >
                      {p?.name}
                    </a>
                  </div>
                </div>
                <div class="flex flex-col space-y-3">
                  <div class="flex flex-col">
                    <p class="font-bold text-xs text-black dark:text-white">
                      Cost
                    </p>
                    <p class="font-bold text-sm">
                      ${p?.price.toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} / unit
                    </p>
                  </div>
                  <div class="flex flex-col">
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
                </div>
                <div class="flex flex-col space-y-1">
                  <p class="font-bold text-xs text-black dark:text-white">
                    Quantity
                  </p>
                  <div class="flex !text-xs">
                    <button
                      class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                      on:click={() =>
                        p
                          ? bag.setItem(
                              p,
                              item.modifiers,
                              Math.max(
                                p?.minQuantity || 1,
                                $bag[item.idx].quantity - 1
                              )
                            )
                          : null}
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
                        p
                          ? bag.setItem(
                              p,
                              item.modifiers,
                              Math.max(
                                p?.minQuantity || 1,
                                $bag[item.idx].quantity + 1
                              )
                            )
                          : null}
                    >
                      <Add16 class="m-auto" />
                    </button>
                  </div>
                </div>
                <div class="flex flex-col space-y-1">
                  <p class="font-bold text-xs text-black dark:text-white">
                    Total
                  </p>
                  <p class="font-bold text-sm">
                    ${(p
                      ? getTotalFromProductModifiers(p, item.modifiers) *
                        item.quantity
                      : 0
                    ).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div class="flex space-x-2 items-center <sm:ml-auto">
                  <button
                    class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                    title="View details"
                    on:click={() => {
                      details = { ...item }
                    }}
                    use:tooltip
                    type="button"
                  >
                    <div class="text-xs">View order details</div>
                    <View16 /></button
                  >
                  <button
                    class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                    title="Delete"
                    on:click={() => {
                      p ? bag.delete(p, item.modifiers) : null
                    }}
                    use:tooltip
                    type="button"><TrashCan16 /></button
                  >
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      <div class="flex space-x-4 w-full justify-end items-center">
        <p class="font-bold text-lg">
          Total: ${total.toLocaleString('en', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}
        </p>
        <button
          class="rounded flex font-bold space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xl py-4 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105"
          style="will-change: transform"
          on:click={() => {
            checkout = true
          }}
        >
          <span>Checkout</span>
          <ArrowRight24 class="m-auto" />
        </button>
      </div>
    {:else}
      <div
        class="flex w-full text-gray-500 items-center justify-center dark:text-gray-400"
      >
        <p class="font-bold text-center text-xl">Add items to bag first</p>
      </div>
    {/if}
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

  .skeleton * {
    opacity: 0;
  }
</style>
