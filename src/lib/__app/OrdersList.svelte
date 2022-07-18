<script lang="ts">
  import { page } from '$app/stores'
  import { watchMedia } from '$lib'
  import type { OrderFee, StrippedOrder } from '$lib/db'
  import trpc, { type InferQueryInput } from '$lib/trpc/client'
  import { tooltip } from '$lib/components/tooltip'
  import { tick } from 'svelte'
  import {
    ChevronDown16,
    ChevronSort16,
    ChevronUp16,
    Launch16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import Submenu from '$lib/components/Submenu.svelte'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Ufo from '$lib/components/__Ufo.svelte'
  import { goto } from '$app/navigation'

  export let orders: StrippedOrder[] | undefined = undefined
  export let customerId: string | undefined = undefined

  export let small = false

  const calcFee = (fee: OrderFee, base: number) =>
    base * ((fee.percentage || 0) / 100) + (fee.fixed || 0)
  const totalFees = (fees: OrderFee[], base: number) =>
    fees?.map((f) => calcFee(f, base)).reduce((a, b) => a + b, 0)

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let idSearch = ''
  const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        orders = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('orders:list', {
        storeId: $page.stuff.store!.id,
        filter: {
          ...filter,
          customerId,
          id: idSearch || undefined,
        },
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
      })
      clearTimeout(waitTimeout)
      orders = filtered
      wait = true
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    if (wait) {
      timeout = setTimeout(() => find(), 500)
    } else {
      find()
    }
  }

  let wait = true

  const filters: Record<
    'all' | 'paid' | 'unpaid' | 'fulfilled' | 'unfulfilled',
    typeof filter
  > = {
    all: {},
    paid: {
      status: ['paid'],
    },
    unpaid: {
      status: ['pending', 'processing'],
    },
    fulfilled: {
      fulfillmentStatus: ['fulfilled'],
    },
    unfulfilled: {
      fulfillmentStatus: [
        'awaiting_shipment',
        'partially_fulfilled',
        'unfulfilled',
        'awaiting_shipment',
      ],
    },
  }

  const sorters: Record<
    Exclude<keyof NonNullable<InferQueryInput<'orders:list'>['orderBy']>, 'id'>,
    {
      asc: typeof sortBy
      desc: typeof sortBy
    }
  > = {
    createdAt: {
      asc: {
        prop: 'createdAt',
        sort: 'asc',
      },
      desc: {
        prop: 'createdAt',
        sort: 'desc',
      },
    },
    total: {
      asc: {
        prop: 'total',
        sort: 'asc',
      },
      desc: {
        prop: 'total',
        sort: 'desc',
      },
    },
  }

  let filter: NonNullable<InferQueryInput<'orders:list'>['filter']> =
    filters.all
  let sortBy: {
    prop: keyof NonNullable<InferQueryInput<'orders:list'>['orderBy']>
    sort: 'asc' | 'desc'
  } = sorters.createdAt.desc

  $: if (browser && sortBy) {
    wait = false
  }

  $: if (browser) {
    search(idSearch, filter, sortBy, customerId)
  }

  const getTotal = (order: StrippedOrder) => {
    const total = order.total ?? 0
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
</script>

<div
  class="border rounded-lg flex flex-col space-y-4 bg-gray-50 border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-600"
>
  <div
    class="flex flex-wrap text-sm w-full text-gray-500 gap-4 items-center !font-bold"
  >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.all}
      class:dark:border-white={filter == filters.all}
      class:text-gray-800={filter == filters.all}
      class:dark:text-white={filter == filters.all}
      on:click={() => {
        wait = false
        filter = filters.all
      }}>All</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.paid}
      class:dark:border-white={filter == filters.paid}
      class:text-gray-800={filter == filters.paid}
      class:dark:text-white={filter == filters.paid}
      on:click={() => {
        wait = false
        filter = filters.paid
      }}>Paid</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.unpaid}
      class:dark:border-white={filter == filters.unpaid}
      class:text-gray-800={filter == filters.unpaid}
      class:dark:text-white={filter == filters.unpaid}
      on:click={() => {
        wait = false
        filter = filters.unpaid
      }}>Unpaid</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.fulfilled}
      class:dark:border-white={filter == filters.fulfilled}
      class:text-gray-800={filter == filters.fulfilled}
      class:dark:text-white={filter == filters.fulfilled}
      on:click={() => {
        wait = false
        filter = filters.fulfilled
      }}>Fulfilled</button
    >
    <button
      class="border-transparent font-bold border-b-2 pb-1 hover:text-gray-800 dark:hover:text-white"
      class:border-gray-800={filter == filters.unfulfilled}
      class:dark:border-white={filter == filters.unfulfilled}
      class:text-gray-800={filter == filters.unfulfilled}
      class:dark:text-white={filter == filters.unfulfilled}
      on:click={() => {
        wait = false
        filter = filters.unfulfilled
      }}>Unfulfilled</button
    >
  </div>
  <div class="flex space-x-2 w-full justify-between items-center">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      type="search"
      bind:value={idSearch}
      placeholder="Search by order id"
    />
    <Submenu>
      <button
        class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 whitespace-nowrap items-center hover:border-gray-300 dark:hover:border-gray-500"
        type="button"
        slot="button"
      >
        <div class="text-xs">Sort by</div>
        <ChevronSort16 /></button
      >
      <div
        class="flex flex-col font-bold divide-y-1 divide-gray-300 text-xs text-gray-80 dark:divide-gray-600 dark:text-white"
        slot="body"
      >
        <div class="flex flex-col space-y-3 pb-3">
          <p class="font-bold">Order date</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.createdAt.asc}
              bind:group={sortBy}
            />
            <div class="flex space-x-1 items-center">
              <ChevronUp16 />
              <span>Ascending</span>
            </div>
          </label>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.createdAt.desc}
              bind:group={sortBy}
            />
            <div class="flex space-x-1 items-center">
              <ChevronDown16 />
              <span>Descending</span>
            </div>
          </label>
        </div>
        <div class="flex flex-col space-y-3 pt-3">
          <p class="font-bold">Total</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input type="radio" value={sorters.total.asc} bind:group={sortBy} />
            <div class="flex space-x-1 items-center">
              <ChevronUp16 />
              <span>Ascending</span>
            </div>
          </label>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.total.desc}
              bind:group={sortBy}
              checked
            />
            <div class="flex space-x-1 items-center">
              <ChevronDown16 />
              <span>Descending</span>
            </div>
          </label>
        </div>
      </div>
    </Submenu>
  </div>
  {#if orders && !orders.length}
    <div
      class="flex flex-col h-full mx-auto space-y-6 w-full py-8 items-center lg:w-8/10"
      in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="w-5/10 lg:w-2/10">
        <Ufo class="h-auto w-full" />
      </div>
      <div class="font-bold font-title text-xl">Nothing here</div>
    </div>
  {:else}
    <div
      class="bg-white border rounded-lg flex border-gray-300 w-full max-h-65vh relative overflow-auto dark:bg-gray-800 dark:border-gray-700"
    >
      {#if !orders}
        <div class="h-64vh w-full skeleton" />
      {:else if $media.small}
        <div
          class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
        >
          {#each orders as o, idx}
            <button
              class="flex flex-col space-y-2 w-full p-2 text-gray-700 dark:text-gray-400"
              on:click={() =>
                goto(`/stores/${$page.stuff.store?.slug}/orders/${o.id}`)}
            >
              <div class="flex w-full items-center justify-between">
                <div class="flex space-x-2 items-center">
                  <p
                    class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform text-gray-800 text-gray-80 whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 dark:text-white hover:overflow-visible"
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
              {#if !customerId}
                <div class="flex w-full justify-between items-center">
                  {#if o.customer}
                    <a
                      href="/stores/{$page.stuff.store?.slug}/customers/{o
                        .customer.id}"
                      class="font-bold space-x-2 text-sm text-gray-800 inline-flex items-center dark:text-white hover:underline"
                    >
                      <span>
                        {o.customer.firstName}
                        {o.customer.lastName}
                      </span>
                      <Launch16 class="inline-flex" />
                    </a>
                  {:else}
                    <p class="text-sm">
                      {#if o.billingData}
                        {o.billingData.firstName} {o.billingData.lastName}
                      {:else}
                        N/A
                      {/if}
                    </p>
                  {/if}
                  <p class="font-bold text-xs text-gray-800 dark:text-white">
                    ${getTotal(o).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              {/if}
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
                  Revenue: <span class="font-bold text-gray-800 dark:text-white"
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
            </button>
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
              {#if !customerId}
                <th scope="col" class="py-3 px-6"> Customer </th>
              {/if}
              <th scope="col" class="text-right py-3 px-6"> Order total </th>
              {#if !small}
                <th scope="col" class="text-right py-3 px-6"> Revenue </th>
              {/if}
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
                  <div class="flex w-12ch">
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
                {#if !customerId}
                  <td>
                    <div class="flex w-full py-4 px-6">
                      {#if o.customer}
                        <a
                          href="/stores/{$page.stuff.store?.slug}/customers/{o
                            .customer.id}"
                          class="font-bold space-x-2 text-xs text-gray-800 inline-flex items-center dark:text-white hover:underline"
                        >
                          <span>
                            {o.customer.firstName}
                            {o.customer.lastName}
                          </span>
                          <Launch16 class="inline-flex" />
                        </a>
                      {:else}
                        <p class="font-bold text-xs w-full">
                          {#if o.billingData}
                            {o.billingData.firstName} {o.billingData.lastName}
                          {:else}
                            N/A
                          {/if}
                        </p>
                      {/if}
                    </div>
                  </td>
                {/if}
                <td>
                  <div class="flex w-full py-4 px-6">
                    <p class="font-bold text-xs text-right w-full">
                      ${getTotal(o).toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </td>
                {#if !small}
                  <td>
                    <div class="flex w-full py-4 px-6">
                      <p class="font-bold text-xs text-right w-full">
                        {#if o.status === 'paid'}
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
                {/if}
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
  {/if}
</div>
