<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, params }) => {
    const store = await trpc(fetch).query('stores:getBySlug', params.slug)
    if (!store) {
      return {
        status: 404,
      }
    }
    const orders = await trpc(fetch).query('orders:list', {
      storeId: store.id,
    })
    return {
      props: {
        orders,
      },
    }
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { pageSubtitle, watchMedia } from '$lib'
  import type { OrderFee, Product, Store, StrippedOrder } from '$lib/db'
  import trpc from '$lib/trpc/client'
  import { tooltip } from '$lib/components/tooltip'
  import { onMount, tick } from 'svelte'
  import {
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import { Launch16 } from 'carbon-icons-svelte'
  import { browser } from '$app/env'

  export let orders: StrippedOrder[] = []

  let mounted = false
  onMount(() => {
    mounted = true
  })
  let products: Record<string, Product> | undefined
  $: if (mounted && orders) {
    loadProducts()
  }

  const calcFee = (fee: OrderFee, base: number) =>
    base * ((fee.percentage || 0) / 100) + (fee.fixed || 0)
  const totalFees = (fees: OrderFee[], base: number) =>
    fees?.map((f) => calcFee(f, base)).reduce((a, b) => a + b, 0)

  const loadProducts = () => {
    if (!orders.length) {
      products = {}
      return
    }
    const ids = [
      ...new Set(
        orders
          .map((o) => o.items)
          .flat()
          .map((i) => i.productId)
      ),
    ]
    if (!ids?.length) {
      products = {}
      return
    }
    let client = trpc()
    const promises = ids.map((id) => client.query('products:getById', id))
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

  let timeout: NodeJS.Timeout
  let idSearch = ''
  const search = async (..._deps: any[]) => {
    products = undefined
    const filtered = await trpc().query('orders:list', {
      storeId: $page.stuff.store!.id,
      filter: {
        id: idSearch || undefined,
      },
    })
    orders = filtered
    tick()
    loadProducts()
  }

  $: if (browser) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => search(idSearch), 500)
  }

  const getTotal = (order: StrippedOrder) => {
    const total =
      order.total ??
      order.items
        .map((i) => ({
          product: products![i.productId],
          quantity: i.quantity,
          modifiers: i.modifiers as ModifiersMap,
        }))
        .map(
          (i) =>
            getTotalFromProductModifiers(i.product, i.modifiers) * i.quantity
        )
        .reduce((a, b) => a + b, 0)
    return total
  }
  const mediaqueries = {
    small: '(max-width: 849px)',
    large: '(min-width: 850px)',
    short: '(max-height: 399px)',
    landscape: '(orientation: landscape) and (max-height: 499px)',
    tiny: '(orientation: portrait) and (max-height: 599px)',
    dark: '(prefers-color-scheme: dark)',
    noanimations: '(prefers-reduced-motion: reduce)',
  }

  const media = watchMedia(mediaqueries)

  $pageSubtitle = 'Sales orders'
</script>

<div class="flex flex-col mx-auto space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Sales orders
  </h3>
  <div class="flex space-x-2 w-full justify-between items-center">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      type="text"
      bind:value={idSearch}
      placeholder="Search by order id"
    />
  </div>
  <div
    class="bg-white border rounded-lg flex border-gray-200 w-full max-h-65vh relative overflow-auto dark:bg-gray-800 dark:border-gray-700"
  >
    {#if !products}
      <div class="h-64vh w-full skeleton" />
    {:else if $media.small}
      <div
        class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
      >
        {#each orders as o, idx}
          <a
            class="flex flex-col space-y-2 w-full p-2"
            href="/stores/{$page.stuff.store?.slug}/orders/{o.id}"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex space-x-2 items-center">
                <p
                  class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible "
                  title="Copy to clipboard"
                  on:click={() => navigator.clipboard.writeText(o.id)}
                  use:tooltip
                >
                  {o.id}
                </p>
                <p
                  class="rounded font-normal text-xs text-white p-1 whitespace-nowrap overflow-ellipsis uppercase"
                  class:bg-green-500={o.status === 'paid'}
                  class:bg-orange-500={o.status === 'pending'}
                  class:bg-purple-500={o.status === 'processing'}
                >
                  {o.status}
                </p>
              </div>
              <p class="text-xs">
                {o.createdAt.toLocaleString()}
              </p>
            </div>
            <div class="flex w-full justify-between items-center">
              <p class="font-bold text-sm w-full">
                {#if o.billingData}
                  {o.billingData.firstName} {o.billingData.lastName}
                {:else}
                  N/A
                {/if}
              </p>
              <p class="font-bold text-xs">
                ${getTotal(o).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div class="flex w-full justify-between items-center">
              <div class="flex space-x-2 items-center">
                <p
                  class="rounded bg-gray-100 text-xs p-1 whitespace-nowrap overflow-ellipsis uppercase dark:bg-gray-600"
                  class:!bg-green-500={o.fulfillmentStatus === 'fulfilled'}
                  class:!text-white={o.fulfillmentStatus === 'fulfilled'}
                >
                  {o.fulfillmentStatus.split('_').join(' ')}
                </p>
                <p class="text-xs">{o.items?.length || 0} items</p>
              </div>
              <p class="text-xs">
                Revenue: <span class="font-bold"
                  >${Math.max(
                    0,
                    getTotal(o) - totalFees(o.fees, getTotal(o))
                  ).toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span
                >
              </p>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <table
        class="text-sm text-left w-full text-gray-500 relative overflow-auto dark:text-gray-400"
      >
        <thead
          class="bg-gray-50 text-xs top-0 text-gray-700 z-20 uppercase sticky dark:bg-gray-700 dark:text-gray-400"
        >
          <tr>
            <th scope="col" class="py-3 px-6"> Order Id </th>
            <th scope="col" class="py-3 px-6"> Status </th>
            <th scope="col" class="py-3 px-6"> Fulfillment Status </th>
            <th scope="col" class="py-3 px-6"> Customer </th>
            <th scope="col" class="text-right py-3 px-6"> Order total </th>
            <th scope="col" class="text-right py-3 px-6"> Revenue </th>
            <th scope="col" class="py-3 px-6"> Order date </th>
            <th scope="col" class="text-center py-3 px-6"> Order items </th>
            <th scope="col" class="text-center py-3 px-6"> Actions </th>
          </tr>
        </thead>
        <tbody>
          {#each orders as o, idx}
            <tr
              class="bg-white dark:bg-gray-800"
              class:border-b={idx !== orders.length - 1}
              class:dark:border-gray-700={idx !== orders.length - 1}
            >
              <th
                scope="row"
                class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
              >
                <div class="flex w-15ch">
                  <p
                    class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible "
                    title="Copy to clipboard"
                    on:click={() => navigator.clipboard.writeText(o.id)}
                    use:tooltip
                  >
                    {o.id}
                  </p>
                </div>
              </th>
              <td class="py-4 px-6">
                <div class="flex">
                  <p
                    class="rounded font-normal text-xs text-white p-1 whitespace-nowrap overflow-ellipsis uppercase"
                    class:bg-green-500={o.status === 'paid'}
                    class:bg-orange-500={o.status === 'pending'}
                    class:bg-purple-500={o.status === 'processing'}
                  >
                    {o.status}
                  </p>
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex">
                  <p
                    class="rounded bg-gray-100 text-xs p-1 whitespace-nowrap overflow-ellipsis uppercase dark:bg-gray-600"
                    class:!bg-green-500={o.fulfillmentStatus === 'fulfilled'}
                    class:!text-white={o.fulfillmentStatus === 'fulfilled'}
                  >
                    {o.fulfillmentStatus.split('_').join(' ')}
                  </p>
                </div>
              </td>
              <td>
                <div class="flex w-full py-4 px-6">
                  <p class="font-bold text-xs w-full">
                    {#if o.billingData}
                      {o.billingData.firstName} {o.billingData.lastName}
                    {:else}
                      N/A
                    {/if}
                  </p>
                </div>
              </td>
              <td>
                <div class="flex w-full py-4 px-6">
                  <p class="font-bold text-xs text-right w-full">
                    {#if products}
                      ${getTotal(o).toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    {/if}
                  </p>
                </div>
              </td>
              <td>
                <div class="flex w-full py-4 px-6">
                  <p class="font-bold text-xs text-right w-full">
                    {#if products && o.status === 'paid'}
                      ${Math.max(
                        0,
                        getTotal(o) - totalFees(o.fees, getTotal(o))
                      ).toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    {:else}
                      N/A
                    {/if}
                  </p>
                </div>
              </td>
              <td>
                <div class="flex py-4 px-6">
                  <p class="font-bold text-xs">
                    {o.createdAt.toLocaleString()}
                  </p>
                </div>
              </td>
              <td class="text-center">
                <div class="flex py-4 px-6">
                  <p class="font-bold text-xs text-center w-full">
                    {o.items?.length}
                  </p>
                </div>
              </td>
              <td class="text-right py-4 px-6">
                <div class="flex">
                  <a
                    class="border-transparent rounded flex mx-auto border-2 p-1 duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                    title="View order"
                    href="/stores/{$page.stuff.store?.slug}/orders/{o.id}"
                    use:tooltip
                    type="button"><Launch16 class="flex" /></a
                  >
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
