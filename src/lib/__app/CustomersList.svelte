<script lang="ts">
  import { page } from '$app/stores'
  import { watchMedia } from '$lib'
  import type { OrderFee, StrippedOrder } from '$lib/db'
  import trpc, {
    type InferMutationOutput,
    type InferQueryInput,
    type InferQueryOutput,
  } from '$lib/trpc/client'
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

  export let customers:
    | InferQueryOutput<'customer:list'>['customers']
    | undefined = undefined
  export let total: number | undefined = undefined

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let nameSearch = ''
  const search = (..._deps: any[]) => {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        customers = undefined
        total = undefined
        tick()
      }, 100)
      const filtered = await trpc().query('customer:list', {
        storeId: $page.stuff.store!.id,
        filter: {
          name: nameSearch || undefined,
        },
        orderBy: {
          [sortBy.prop]: sortBy.sort,
        },
      })
      clearTimeout(waitTimeout)
      customers = filtered.customers
      total = filtered.count
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

  const sorters: Record<
    Exclude<
      keyof NonNullable<InferQueryInput<'customer:list'>['orderBy']>,
      'id'
    >,
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
    firstName: {
      asc: {
        prop: 'firstName',
        sort: 'asc',
      },
      desc: {
        prop: 'firstName',
        sort: 'desc',
      },
    },
    lastName: {
      asc: {
        prop: 'lastName',
        sort: 'asc',
      },
      desc: {
        prop: 'lastName',
        sort: 'desc',
      },
    },
    email: {
      asc: {
        prop: 'email',
        sort: 'asc',
      },
      desc: {
        prop: 'email',
        sort: 'desc',
      },
    },
  }

  let sortBy: {
    prop: keyof NonNullable<InferQueryInput<'customer:list'>['orderBy']>
    sort: 'asc' | 'desc'
  } = sorters.firstName.asc

  $: if (browser && sortBy) {
    wait = false
  }

  $: if (browser) {
    search(nameSearch, sortBy)
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
  <div class="flex space-x-2 w-full justify-between items-center">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      type="search"
      bind:value={nameSearch}
      placeholder="Search by customer id, name or email"
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
        <!-- <div class="flex flex-col space-y-3 pb-3">
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
        </div> -->
        <div class="flex flex-col space-y-3 pb-3">
          <p class="font-bold">First name</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.firstName.asc}
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
              value={sorters.firstName.desc}
              bind:group={sortBy}
              checked
            />
            <div class="flex space-x-1 items-center">
              <ChevronDown16 />
              <span>Descending</span>
            </div>
          </label>
        </div>
        <div class="flex flex-col space-y-3 py-3">
          <p class="font-bold">Last name</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.lastName.asc}
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
              value={sorters.lastName.desc}
              bind:group={sortBy}
              checked
            />
            <div class="flex space-x-1 items-center">
              <ChevronDown16 />
              <span>Descending</span>
            </div>
          </label>
        </div>
        <div class="flex flex-col space-y-3 py-3">
          <p class="font-bold">Email</p>
          <label class="flex font-normal space-x-2 text-xs">
            <input type="radio" value={sorters.email.asc} bind:group={sortBy} />
            <div class="flex space-x-1 items-center">
              <ChevronUp16 />
              <span>Ascending</span>
            </div>
          </label>
          <label class="flex font-normal space-x-2 text-xs">
            <input
              type="radio"
              value={sorters.email.desc}
              bind:group={sortBy}
              checked
            />
            <div class="flex space-x-1 items-center">
              <ChevronDown16 />
              <span>Descending</span>
            </div>
          </label>
        </div>
        <div class="flex flex-col space-y-3 pt-3">
          <p class="font-bold">Registration date</p>
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
  {#if customers && !customers.length}
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
      {#if !customers}
        <div class="h-64vh w-full skeleton" />
      {:else if $media.small}
        <div
          class="flex flex-col divide-y-1 divide-gray-300 w-full dark:divide-gray-600"
        >
          {#each customers as c, idx}
            <button
              class="flex flex-col space-y-2 w-full p-2 text-gray-700 dark:text-gray-400"
              on:click={() =>
                goto(`/stores/${$page.stuff.store?.slug}/customers/${c.id}`)}
            >
              <!-- <div class="flex w-full items-center justify-between">
                <div class="flex space-x-2 items-center">
                  <p
                    class="rounded cursor-pointer font-normal bg-gray-100 text-xs text-white p-1 transform text-gray-80 whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible"
                    title="Copy to clipboard"
                    on:click={() => navigator.clipboard.writeText(c.id)}
                    use:tooltip
                  >
                    {c.id}
                  </p>
                  <p
                    class="rounded font-normal text-xs text-white p-1 whitespace-nowrap overflow-ellipsis uppercase"
                    class:bg-green-500={c.status === 'paid'}
                    class:bg-orange-500={c.status === 'pending'}
                    class:bg-purple-500={c.status === 'processing'}
                  >
                    {c.status}
                  </p>
                </div>
                <p class="text-xs">
                  {c.createdAt.toLocaleString()}
                </p>
              </div>
              <div class="flex w-full justify-between items-center">
                {#if c.customer}
                  <a
                    href="/stores/{$page.stuff.store?.slug}/customers/{c
                      .customer.id}"
                    class="font-bold space-x-2 text-sm text-gray-800 inline-flex items-center dark:text-white hover:underline"
                  >
                    <span>
                      {c.customer.firstName}
                      {c.customer.lastName}
                    </span>
                    <Launch16 class="inline-flex" />
                  </a>
                {:else}
                  <p class="text-sm">
                    {#if c.billingData}
                      {c.billingData.firstName} {c.billingData.lastName}
                    {:else}
                      N/A
                    {/if}
                  </p>
                {/if}
                <p class="font-bold text-xs text-gray-800 dark:text-white">
                  ${getTotal(c).toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div class="flex w-full justify-between items-center">
                <div class="flex space-x-2 items-center">
                  <p
                    class="rounded bg-gray-100 text-xs p-1 whitespace-nowrap overflow-ellipsis uppercase dark:bg-gray-600"
                    class:!bg-green-500={c.fulfillmentStatus === 'fulfilled'}
                    class:!text-white={c.fulfillmentStatus === 'fulfilled'}
                  >
                    {c.fulfillmentStatus.split('_').join(' ')}
                  </p>
                  <p class="text-xs">{c.items?.length || 0} items</p>
                </div>
                <p class="text-xs">
                  Revenue: <span class="font-bold text-gray-800 dark:text-white"
                    >${Math.max(
                      0,
                      getTotal(c) - totalFees(c.fees, getTotal(c))
                    ).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </p>
              </div> -->
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
              <th scope="col" class="py-3 px-6"> Customer Id </th>
              <th scope="col" class="py-3 px-6"> First name </th>
              <th scope="col" class="py-3 px-6"> Last name </th>
              <th scope="col" class="py-3 px-6"> Email </th>
              <th scope="col" class="text-right py-3 px-6"> Orders </th>
              <th scope="col" class="py-3 px-6"> Registered at </th>
              <!-- <th scope="col" class="text-center py-3 px-6"> Orders items </th> -->
              <th scope="col" class="text-center py-3 px-6"> Actions </th>
            </tr>
          </thead>
          <tbody>
            {#each customers as c, idx}
              <tr
                class="bg-white dark:bg-gray-800"
                class:border-b={idx !== customers.length - 1}
                class:dark:border-gray-700={idx !== customers.length - 1}
              >
                <th
                  scope="row"
                  class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
                >
                  <div class="flex w-12ch">
                    <p
                      class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible "
                      title="Copy to clipboard"
                      on:click={() => navigator.clipboard.writeText(c.id)}
                      use:tooltip
                    >
                      {c.id}
                    </p>
                  </div>
                </th>
                <td>
                  <div class="flex w-full py-4 px-6">
                    <p class="font-bold text-xs w-full">
                      {c.firstName}
                    </p>
                  </div>
                </td>
                <td>
                  <div class="flex w-full py-4 px-6">
                    <p class="font-bold text-xs w-full">
                      {c.lastName}
                    </p>
                  </div>
                </td>
                <td>
                  <div class="flex w-full py-4 px-6">
                    <a class="font-bold text-xs w-full" href="mailto:{c.email}">
                      {c.email}
                    </a>
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex py-4 px-6">
                    <p class="font-bold text-xs w-full">
                      {c._count.orders} orders
                    </p>
                  </div>
                </td>
                <td>
                  <div class="flex py-4 px-6">
                    <p class="font-bold text-xs">
                      {c.createdAt.toLocaleString()}
                    </p>
                  </div>
                </td>
                <!-- <td class="text-center">
                  <div class="flex py-4 px-6">
                    <p class="font-bold text-xs text-center w-full">
                      {o.items?.length}
                    </p>
                  </div>
                </td> -->
                <td class="text-right py-4 px-6">
                  <div class="flex">
                    <a
                      class="border-transparent rounded flex mx-auto border-2 p-1 duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                      title="View customer"
                      href="/stores/{$page.stuff.store?.slug}/customers/{c.id}"
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
