<script lang="ts">
  import type { Order, OrderItem, Product } from '$lib/db'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
  } from '$lib/utils/modifiers'
  import {
    Add16,
    Checkmark16,
    Close16,
    FaceDizzy32,
    Launch16,
    Map16,
    Pen16,
    Subtract16,
    View16,
  } from 'carbon-icons-svelte'
  import BagItemDetails from '$lib/__storefront/BagItemDetails.svelte'
  import type { BagItem } from '$lib'
  import StripeLogo from '$lib/components/__StripeLogo.svelte'
  import PaypalLogo from '$lib/components/__PaypalLogo.svelte'
  import type { OrderFee } from '$lib/db'
  import { getCountries } from '$lib/utils/countries'
  import { tooltip } from '$lib/components/tooltip'
  import { clamp } from '$lib/utils/math'
  import { pageSubtitle } from '$lib'
  import trpc from '$lib/trpc/client'

  const countries = getCountries()

  let editCustomer = false
  let editShipping = false

  export let order: Order
  export let mode: 'app' | 'customer' = 'app'

  let mounted = false
  onMount(() => {
    mounted = true
    console.log(order?.billingData)
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

  let details: (BagItem & { cost: number }) | undefined

  const getMapsUrl = (lat: number, long: number) =>
    `https://www.google.com/maps/place/${lat},${long}`

  const calcFee = (fee: OrderFee, base: number) =>
    base * ((fee.percentage || 0) / 100) + (fee.fixed || 0)

  $: totalFees = order.fees
    ?.map((f) => calcFee(f, total))
    .reduce((a, b) => a + b, 0)

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

  const setFulfillment = () => {
    fulfillmentMode = !fulfillmentMode
    itemsData = JSON.parse(JSON.stringify(order.items))
  }

  const saveFulfillment = () => {
    const valid = Array.from(
      (document.getElementsByClassName(
        'fulfillment'
      ) as HTMLCollectionOf<HTMLInputElement>) || []
    )
      .map((el) => el.reportValidity())
      .every((el) => el)
    if (valid) {
      itemsData = null
      fulfillmentMode = false
      const made = order.items
        .map((i) => i.fulfilled)
        .reduce((a, b) => a + b, 0)
      const total = order.items
        .map((i) => i.quantity)
        .reduce((a, b) => a + b, 0)
      order.fulfillmentStatus =
        total === made
          ? 'fulfilled'
          : made === 0
          ? 'unfulfilled'
          : 'partially_fulfilled'
      trpc().mutation('orders:update', {
        id: order.id,
        items: order.items,
        fulfillmentStatus: order.fulfillmentStatus,
      })
    }
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
      return `${prefix} = $${calcFee(fee, total).toLocaleString('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return prefix
  }

  let customerData: any | null = null
  const updateCustomer = () => {
    const valid = Array.from(
      document.getElementById('customer')?.querySelectorAll('input') || []
    )
      .map((el) => el.reportValidity())
      .every((el) => el)
    if (valid) {
      trpc().mutation('orders:update', {
        id: order.id,
        billingData: { ...order.billingData },
      })
      customerData = null
      editCustomer = false
    }
  }

  let shippingData: any | null = null
  const updateShipping = () => {
    const valid = Array.from(
      document.getElementById('shipping')?.querySelectorAll('input') || []
    )
      .map((el) => el.reportValidity())
      .every((el) => el)
    if (valid) {
      trpc().mutation('orders:update', {
        id: order.id,
        shippingData: { ...order.shippingData },
      })
      shippingData = null
      editShipping = false
    }
  }

  let fulfillmentMode = false
  let itemsData: OrderItem[] | null = null

  const methodsLogo = {
    stripe: StripeLogo,
    paypal: PaypalLogo,
  }

  $: console.log(order.items)
</script>

{#if $page.stuff.store}
  <BagItemDetails bind:item={details} store={$page.stuff.store} disabled />
{/if}

<div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-10">
  <div class="flex flex-col space-y-4 lg:col-span-7 <lg:row-start-2">
    {#if order.items.length}
      <div
        class="bg-white border rounded-lg flex flex-col border-gray-300 w-full relative overflow-hidden dark:divide-gray-700 dark:bg-gray-800 dark:border-gray-600"
      >
        <div
          class="border-b flex space-x-2 border-gray-300 w-full p-4 justify-between items-center dark:border-gray-600"
        >
          <div class="flex space-x-2 items-center">
            <div class="flex">
              <p
                class="rounded bg-gray-100 text-xs p-1 whitespace-nowrap overflow-ellipsis uppercase dark:bg-gray-600"
                class:!bg-green-500={order.fulfillmentStatus === 'fulfilled'}
                class:!text-white={order.fulfillmentStatus === 'fulfilled'}
              >
                {order.fulfillmentStatus.split('_').join(' ')}
              </p>
            </div>
            <p class="font-bold text-xs">
              Fulfilled {Math.min(
                order.items.map((i) => i.quantity).reduce((a, b) => a + b, 0),
                order.items.map((i) => i.fulfilled).reduce((a, b) => a + b, 0)
              )} of {order.items
                .map((i) => i.quantity)
                .reduce((a, b) => a + b, 0)} items
            </p>
          </div>
          {#if mode === 'app'}
            <div class="flex space-x-2 items-center">
              {#if fulfillmentMode}
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Cancel"
                  use:tooltip
                  on:click={() => {
                    order.items = [...(itemsData || [])]
                    itemsData = null
                    fulfillmentMode = false
                  }}
                >
                  <Close16 />
                </button>
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Save"
                  use:tooltip
                  on:click={() => {
                    saveFulfillment()
                  }}
                >
                  <Checkmark16 />
                </button>
              {:else if order.fulfillmentStatus !== 'fulfilled'}
                <button
                  class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
                  on:click={setFulfillment}
                  >{fulfillmentMode ? 'Save' : 'Set'} fulfillment</button
                >
              {/if}
            </div>
          {/if}
        </div>
        <div
          class="divide-y flex flex-col border-gray-300 w-full max-h-65vh relative overflow-x-auto overscroll-auto lg:max-h-176px dark:divide-gray-700 dark:bg-gray-800 dark:border-gray-600"
        >
          {#each order.items as item, idx}
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
                    class="rounded-lg bg-gray-100 w-full overflow-hidden pointer-events-none select-none sm:w-36  dark:bg-gray-900"
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
                          controls={false}
                        />
                      {/if}
                    </div>
                  </div>
                  <div
                    class="flex flex-col space-y-1 w-full whitespace-normal sm:w-40"
                  >
                    {#if p?.archived}
                      <p
                        class="font-bold text-lg leading-tight text-red-500 line-through sm:text-xs"
                        title="Deleted product"
                        use:tooltip
                      >
                        {p?.name}
                      </p>
                    {:else}
                      <a
                        href="{mode === 'customer'
                          ? ''
                          : `/stores/${$page.stuff.store?.slug}`}/products/{p?.slug}"
                        target="__blank"
                        class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white hover:underline"
                      >
                        {p?.name}
                      </a>
                    {/if}
                  </div>
                </div>
                {#if fulfillmentMode}
                  <div class="flex flex-col space-y-1">
                    <p class="font-bold text-xs text-black dark:text-white">
                      Fulfilled ({itemsData ? itemsData[idx]?.fulfilled : 0} of
                      {item.quantity})
                    </p>
                    <div class="flex !text-xs">
                      <button
                        class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                        on:click={() => {
                          item.fulfilled = clamp({
                            max: item.quantity,
                            min: itemsData ? itemsData[idx].fulfilled : 0,
                            val: item.fulfilled - 1,
                          })
                        }}
                      >
                        <Subtract16 class="m-auto" />
                      </button>
                      <input
                        class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-8ch quantity fulfillment dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
                        type="number"
                        bind:value={item.fulfilled}
                        min={itemsData ? itemsData[idx].fulfilled : 0}
                        max={item.quantity}
                        required
                      />
                      <button
                        class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
                        on:click={() => {
                          item.fulfilled = clamp({
                            max: item.quantity,
                            min: itemsData ? itemsData[idx].fulfilled : 0,
                            val: item.fulfilled + 1,
                          })
                        }}
                      >
                        <Add16 class="m-auto" />
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="flex flex-col space-y-3">
                    <div class="flex flex-col">
                      <p class="font-bold text-xs text-black dark:text-white">
                        Cost
                      </p>
                      <p class="font-bold text-sm">
                        ${(item.basePrice ?? p?.price).toLocaleString('en', {
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
                          ? getCostFromProductModifiers(
                              p,
                              item.modifiers,
                              item.basePrice
                            )
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
                    <p class="font-bold text-xs">
                      Fulfilled {item.fulfilled} of
                      {item.quantity}
                    </p>
                  </div>
                {/if}
                <div class="flex flex-col space-y-1">
                  <p class="font-bold text-xs text-black dark:text-white">
                    Total
                  </p>
                  <p class="font-bold text-sm">
                    ${(p
                      ? getTotalFromProductModifiers(
                          p,
                          item.modifiers,
                          item.basePrice
                        ) * item.quantity
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
                        cost: item.basePrice,
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
      </div>
    {/if}
    <div
      class="w-full grid gap-4"
      class:sm:grid-cols-2={order.billingData && order.shippingData}
    >
      {#if order.billingData}
        <div
          class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
          id="customer"
        >
          <div class="flex space-x-2 items-center justify-between">
            <h4 class="font-bold font-title text-black dark:text-white">
              Billing details
            </h4>
            <div class="flex space-x-2 items-center items-end">
              {#if editCustomer}
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Cancel"
                  use:tooltip
                  on:click={() => {
                    order.billingData = { ...customerData }
                    customerData = null
                    editCustomer = false
                  }}
                >
                  <Close16 />
                </button>
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Save"
                  use:tooltip
                  on:click={() => {
                    updateCustomer()
                  }}
                >
                  <Checkmark16 />
                </button>
              {:else}
                {#if order.billingData?.coords}
                  <a
                    class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                    href={getMapsUrl(
                      order.billingData?.coords?.latitude,
                      order.billingData?.coords?.longitude
                    )}
                    target="__blank"
                    title="View real billing geolocation in a map"
                    use:tooltip
                  >
                    <Map16 class="flex" />
                  </a>
                {/if}
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Edit customer"
                  use:tooltip
                  on:click={() => {
                    customerData = { ...order.billingData }
                    editCustomer = true
                  }}
                >
                  <Pen16 />
                </button>
              {/if}
            </div>
          </div>
          <div class="text-xs w-full grid gap-4 grid-cols-2">
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Email:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="email"
                bind:value={order.billingData.email}
                disabled={!editCustomer}
                autocomplete="nope"
                aria-autocomplete="none"
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Phone number:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="tel"
                bind:value={order.billingData.phone}
                disabled={!editCustomer}
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">First name:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.firstName}
                autocomplete="nope"
                disabled={!editCustomer}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Last name:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.lastName}
                autocomplete="nope"
                disabled={!editCustomer}
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Country/Region:</p>
              <select
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                bind:value={order.billingData.country}
                disabled={!editCustomer}
                autocomplete="nope"
                required
              >
                {#each countries as c}
                  <option value={c.code}>{c.name}</option>
                {/each}
              </select>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Province/State:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.province}
                disabled={!editCustomer}
                required
                autocomplete="nope"
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Address:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.address}
                disabled={!editCustomer}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">City:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.city}
                disabled={!editCustomer}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">ZIP/Postal code:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.billingData.zip}
                disabled={!editCustomer}
                required
              />
            </div>
          </div>
        </div>
      {/if}
      {#if order.shippingData}
        <div
          class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
          id="shipping"
        >
          <div class="flex space-x-2 items-center justify-between">
            <h4 class="font-bold font-title text-black dark:text-white">
              Shipping details
            </h4>
            <div class="flex space-x-2 items-center items-end">
              {#if editShipping}
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Cancel"
                  use:tooltip
                  on:click={() => {
                    order.shippingData = { ...shippingData }
                    shippingData = null
                    editShipping = false
                  }}
                >
                  <Close16 />
                </button>
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Save"
                  use:tooltip
                  on:click={() => {
                    updateShipping()
                  }}
                >
                  <Checkmark16 />
                </button>
              {:else}
                {#if order.shippingData?.coords}
                  <a
                    class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                    href={getMapsUrl(
                      order.shippingData?.coords?.latitude,
                      order.shippingData?.coords?.longitude
                    )}
                    target="__blank"
                    title="View real shipping geolocation in a map"
                    use:tooltip
                  >
                    <Map16 class="flex" />
                  </a>
                {/if}
                <button
                  class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                  title="Edit shipping"
                  use:tooltip
                  on:click={() => {
                    shippingData = { ...order.shippingData }
                    editShipping = true
                  }}
                >
                  <Pen16 />
                </button>
              {/if}
            </div>
          </div>
          <div class="text-xs w-full grid gap-4 grid-cols-2">
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Email:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="email"
                bind:value={order.shippingData.email}
                disabled={!editShipping}
                autocomplete="nope"
                aria-autocomplete="none"
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Phone number:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="tel"
                bind:value={order.shippingData.phone}
                disabled={!editShipping}
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">First name:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.firstName}
                autocomplete="nope"
                disabled={!editShipping}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Last name:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.lastName}
                autocomplete="nope"
                disabled={!editShipping}
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Country/Region:</p>
              <select
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                bind:value={order.shippingData.country}
                disabled={!editShipping}
                autocomplete="nope"
                required
              >
                {#each countries as c}
                  <option value={c.code}>{c.name}</option>
                {/each}
              </select>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Province/State:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.province}
                disabled={!editShipping}
                required
                autocomplete="nope"
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">Address:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.address}
                disabled={!editShipping}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">City:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.city}
                disabled={!editShipping}
                required
              />
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold">ZIP/Postal code:</p>
              <input
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-900"
                type="text"
                bind:value={order.shippingData.zip}
                disabled={!editShipping}
                required
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="flex flex-col h-full space-y-4 w-full relative lg:col-span-3">
    <div
      class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
    >
      <div class="flex w-full items-center justify-between">
        <h4 class="font-bold font-title text-black dark:text-white">
          Order details
        </h4>
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
        </div>
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
        {#if order.fees?.length && mode === 'app'}
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
              <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                <div class="flex justify-between">
                  <div>Total fees:</div>
                  <p>
                    ${totalFees.toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
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
                <div>Subtotal ({order.items?.length || 0} items):</div>
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
                  ${(0).toLocaleString('en', {
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
            {#if mode === 'app'}
              <div class="flex flex-col font-bold space-y-4 text-xs p-2">
                <div class="flex justify-between">
                  <div>Revenue:</div>
                  <p>
                    Total - fees = ${Math.max(
                      total - totalFees,
                      0
                    ).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
        {#if order.billingData.ip && mode === 'app'}
          <div class="flex space-x-2 w-full items-center">
            <div class="relative">
              <div
                class="rounded-full flex bg-green-500 h-8px animate-ping w-8px absolute"
              />
              <div
                class="rounded-full flex bg-green-500 h-8px w-8px relative"
              />
            </div>
            <p class="text-xs">
              This order was placed from IP address <span
                class="rounded cursor-pointer font-bold font-mono bg-gray-100 p-1 dark:bg-gray-700"
                title="Copy address"
                on:click={() => {
                  navigator.clipboard.writeText(order.billingData.ip)
                }}
                use:tooltip>{order.billingData.ip}</span
              >
            </p>
          </div>
        {/if}
      </div>
    </div>
    {#if mode === 'app'}
      <div
        class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
      >
        <div class="flex w-full items-center justify-between">
          <h4 class="font-bold font-title text-black dark:text-white">
            Customer details
          </h4>
          {#if order.customer}
            <div class="flex space-x-2 items-center">
              <a
                class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                href="/stores/{$page.stuff.store
                  ?.slug}/customers/{order.customerId}"
                title="Go to customer page"
                use:tooltip
              >
                <Launch16 class="flex" />
              </a>
            </div>
          {/if}
        </div>
        <div
          class="border rounded-full flex font-bold font-title mx-auto from-green-300 to-pink-600 border-gray-500 h-72px text-4xl leading-[0] w-72px items-center justify-center uppercase dark:bg-gray-600 dark:from-green-400 dark:to-pink-700"
          class:!border-gray-200={order.customer}
          class:bg-gradient-to-br={order.customer}
          class:text-white={order.customer}
        >
          {#if order.customer}
            {order.customer.firstName[0]}
          {:else}
            <FaceDizzy32 />
          {/if}
        </div>
        <p class="font-bold font-title text-black text-center dark:text-white">
          {#if order.customer}
            {order.customer.firstName}
            {order.customer.lastName}
            <br />
            <a
              class="font-normal text-xs hover:underline"
              href="mailto:{order.customer.email}">{order.customer.email}</a
            >
          {:else}
            Not registered
          {/if}
        </p>
        {#if order.customer}
          <div class="flex w-full items-center justify-between">
            <p
              class="font-bold font-title text-black text-left text-xs dark:text-white"
            >
              Registered at
              <br />
              <span class="font-normal"
                >{order.customer.createdAt.toLocaleString()}</span
              >
            </p>
            <p
              class="font-bold font-title text-black text-right text-xs dark:text-white"
            >
              Phone number
              <br />
              <a
                class="font-normal hover:underline"
                href="tel:{order.customer.phoneNumber}"
                >{order.customer.phoneNumber}</a
              >
            </p>
          </div>
        {/if}
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

  @media print {
    * {
      color: black;
    }
  }
</style>
