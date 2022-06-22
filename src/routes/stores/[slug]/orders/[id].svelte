<script context="module" lang="ts">
  import trpc from '$lib/trpc/client'
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, params }) => {
    const store = await trpc(fetch).query('stores:getBySlug', params.slug)
    if (!store) {
      return {
        status: 404,
      }
    }
    const order = await trpc(fetch).query('orders:get', {
      orderId: params.id,
    })
    if (!order || order.storeId != store.id) {
      return {
        status: 404,
      }
    }
    return {
      props: {
        order,
      },
    }
  }
</script>

<script lang="ts">
  import type { Order, Product } from '$lib/db'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
  } from '$lib/utils/modifiers'
  import { View16 } from 'carbon-icons-svelte'
  import BagItemDetails from '$lib/__storefront/BagItemDetails.svelte'
  import type { BagItem } from '$lib'

  export let order: Order

  let mounted = false
  onMount(() => {
    mounted = true
  })
  let products: Record<string, Product>
  $: if (mounted && $page.stuff.store && order.items) {
    loadProducts()
  }

  const loadProducts = () => {
    if (!order.items.length) {
      products = {}
      return
    }
    let client = trpc()
    const promises = [...new Set(order.items.map((p) => p.productId))].map(
      (productId) => client.query('products:getById', productId)
    )
    Promise.all(promises).then(
      (p) =>
        (products = p.reduce(
          (a, v) => ({
            ...a,
            [v!.id]: v,
          }),
          {}
        ))
    )
  }

  let details: BagItem | undefined
</script>

{#if $page.stuff.store}
  <BagItemDetails bind:item={details} store={$page.stuff.store} />
{/if}

<div class="flex flex-col mx-auto space-y-4 lg:max-w-7/10">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Order id <span
      class="rounded font-mono font-normal bg-gray-300 text-xs ml-2 p-1 dark:bg-gray-600"
      >{order.id}</span
    >
  </h3>
  {#if order.items.length}
    <h4 class="font-bold font-title text-black text-xl mb-4 dark:text-white">
      Items details ({order.items.length} items)
    </h4>
    <div
      class="divide-y border rounded-lg flex flex-col w-full max-h-70vh relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
    >
      {#each order.items as item}
        {@const p = products ? products[item.productId] : null}
        <div class="relative">
          <div
            class="flex p-4 text-gray-500 justify-between relative sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
            class:skeleton={!p}
            class:pointer-events-none={!p}
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
                          item.modifiers
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
                <p class="font-bold text-xs text-black dark:text-white">Cost</p>
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
              <p class="font-bold text-sm">
                {item.quantity}
              </p>
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
                })}
              </p>
            </div>
            <div class="flex space-x-2 items-center <sm:ml-auto">
              <button
                class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                title="View details"
                type="button"
                on:click={() => {
                  details = {
                    key: '',
                    modifiers: item.modifiers,
                    productSlug: p?.slug || '',
                    quantity: item.quantity,
                  }
                }}
              >
                <div class="text-xs">View order details</div>
                <View16 /></button
              >
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .skeleton * {
    opacity: 0;
  }
</style>
