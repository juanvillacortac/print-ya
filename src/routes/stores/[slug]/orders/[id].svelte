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
  import StripeLogo from '$lib/components/__StripeLogo.svelte'
  import PaypalLogo from '$lib/components/__PaypalLogo.svelte'
  import type { OrderFee } from '$lib/db'
  import { getCountries } from '$lib/utils/countries'

  const countries = getCountries()

  const getCountry = (code: string) => countries.find((c) => c.code === code)

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

  const getTotal = (order: Order) => {
    const total = order.items
      .map((i) => ({
        product: products[i.productId],
        quantity: i.quantity,
        modifiers: i.modifiers,
      }))
      .map(
        (i) => getTotalFromProductModifiers(i.product, i.modifiers) * i.quantity
      )
      .reduce((a, b) => a + b, 0)
    return total
  }

  $: total = products ? getTotal(order) : 0

  $: feeStr = (fee: OrderFee) => {
    const total = products ? getTotal(order) : 0
    let arr: string[] = []
    if (fee.percentage) {
      arr.push(
        `${fee.percentage.toLocaleString('en', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}%`
      )
    }
    if (fee.fixed) {
      arr.push(
        `$${fee.fixed.toLocaleString('en', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      )
    }
    const prefix = arr.join(' + ')
    if (fee.percentage) {
      const newTotal = total * (fee.percentage / 100) + fee.fixed
      return `${prefix} = $${newTotal.toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return prefix
  }

  const methodsLogo = {
    stripe: StripeLogo,
    paypal: PaypalLogo,
  }
</script>

{#if $page.stuff.store}
  <BagItemDetails bind:item={details} store={$page.stuff.store} />
{/if}

<div class="flex flex-col mx-auto space-y-4">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Order # <span
      class="rounded font-mono font-normal bg-gray-200 text-xs ml-2 p-1 dark:bg-gray-600"
      >{order.id}</span
    >
  </h3>
  <div class="w-full grid gap-4 grid-cols-5">
    <div class="flex flex-col space-y-4 col-span-3">
      {#if order.items.length}
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
                  <p class="font-bold text-sm">
                    {item.quantity}
                  </p>
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
                    <div class="text-xs">View details</div>
                    <View16 /></button
                  >
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex flex-col h-full space-y-4 w-full col-span-2 relative">
      <div
        class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
      >
        <div class="flex space-x-2 items-center">
          <div class="flex">
            <p
              class="rounded cursor-pointer font-normal font-bold text-xs text-white p-1 whitespace-nowrap overflow-ellipsis uppercase"
              class:bg-green-500={order.status === 'paid'}
              class:bg-orange-500={order.status === 'pending'}
              class:bg-purple-500={order.status === 'processing'}
            >
              {order.status}
            </p>
          </div>
          <h4 class="font-bold font-title text-black dark:text-white">
            Order details
          </h4>
        </div>
        <p class="text-xs">{order.createdAt.toLocaleString()}</p>
        <div class="flex flex-col space-y-4 text-xs">
          {#if order.paymentMethods?.length}
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Payment methods:</p>
              <div class="flex flex-wrap -m-1">
                {#each order.paymentMethods as p}
                  <div class="h-1.5rem p-1">
                    <svelte:component
                      this={methodsLogo[p]}
                      class="h-full w-auto"
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          {#if order.fees?.length}
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-sm">Fees</p>
              <div
                class="divide-y border rounded rounded-lg flex flex-col w-full dark:divide-gray-600 dark:border-gray-600"
              >
                {#each order.fees as f}
                  <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                    <div class="flex justify-between">
                      <div>{f.name}:</div>
                      <p>
                        {feeStr(f)}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          <div class="flex flex-col space-y-1">
            <p class="font-bold text-sm">Totals</p>
            <div
              class="divide-y border rounded rounded-lg flex flex-col w-full dark:divide-gray-600 dark:border-gray-600"
            >
              <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                <div class="flex justify-between">
                  <div>Subtotal:</div>
                  <p>
                    ${total.toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                <div class="flex justify-between">
                  <div>Shipping:</div>
                  <p>
                    ${total.toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                <div class="flex justify-between">
                  <div>Total:</div>
                  <p>
                    ${total.toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {#if order.billingData}
        <div
          class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
        >
          <div class="flex space-x-2 items-center">
            <h4 class="font-bold font-title text-black dark:text-white">
              Customer details
            </h4>
          </div>
          <div class="text-xs w-full grid gap-4 grid-cols-2">
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Email:</p>
              <p>{order.billingData.email}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Phone number:</p>
              <p>{order.billingData.phone}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">First name:</p>
              <p>{order.billingData.firstName}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Last name:</p>
              <p>{order.billingData.lastName}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Country/Region:</p>
              <p>{getCountry(order.billingData.country)?.name}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Province/State:</p>
              <p>{order.billingData.province}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Address:</p>
              <p>{order.billingData.address}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">City:</p>
              <p>{order.billingData.city}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">ZIP/Postal code:</p>
              <p>{order.billingData.zip}</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .skeleton * {
    opacity: 0;
  }

  @media print {
    * {
      color: black;
    }
  }
</style>
