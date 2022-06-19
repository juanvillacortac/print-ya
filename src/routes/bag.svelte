<script lang="ts">
  import { page } from '$app/stores'
  import { bag, preferences, type BagItem } from '$lib'
  import { get, post } from '$lib/api'
  import { tooltip } from '$lib/components/tooltip'
  import {
    CardNumber,
    Container as StripeContainer,
    CardCvc,
    CardExpiry,
    PaymentRequestButton,
  } from 'svelte-stripe'
  import { loadScript } from '@paypal/paypal-js'

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
    CheckmarkFilled32,
    ChevronLeft24,
    Close24,
    Subtract16,
    TrashCan16,
    View16,
  } from 'carbon-icons-svelte'

  import { loadStripe, type Stripe, type StripeError } from '@stripe/stripe-js'

  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { getCountries } from '$lib/utils/countries'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { fade, scale, slide } from 'svelte/transition'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'

  let mounted = false
  let stripe: Stripe
  onMount(async () => {
    mounted = true
    stripe = await loadStripe(
      'pk_test_51I7RL6J2WplztltUdJyNQb1xLxVbXhB6QUu3R753Vuxq1xatD8cpU49K5m3q0fPfnK4ayhMPfg8xjLxxbrVqHjG600IC5Q2yzL'
    )
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

  const countries = getCountries()

  let checkout = false
  let payment = false

  const createPaypal = (el: string | HTMLElement, amount: number) =>
    loadScript({
      'client-id':
        'AeFkK76hZkhCrPuLpM1yAiCHXSzro1INVTH2S0WFmzuWekXPCIh4tdAGW569cRVRGIoLIUdOwrggqo-T',
    }).then((paypal) => {
      paypal
        .Buttons({
          style: {
            color: 'blue',
            shape: 'rect',
            height: 40,
            label: 'pay',
            tagline: false,
            layout: 'horizontal',
          },
          createOrder: function (data, actions) {
            // Set up the transaction
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: `${amount}`,
                    currency_code: 'USD',
                  },
                },
              ],
            })
          },
          onApprove: function (data, actions) {
            // Capture order after payment approved
            return actions.order.capture().then(function (details) {
              confirmPayment()
            })
          },
          onError: function (err) {
            // Log error if something goes wrong during approval
            alert('Something went wrong')
            console.log('Something went wrong', err)
          },
        })
        .render(el)
    })

  const submit = async () => {
    if (!payment) {
      // done = total
      // payment = false
      // bag.clear()
      payment = true
      createPaypal('#paypal-button', total)
      return
    }

    // create the payment intent server-side
    const clientSecret = await createPaymentIntent()
    // confirm payment with stripe
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })
    console.log({ result })
    if (result.error) {
      // payment failed, notify user
      error = result.error
      return
    }
    confirmPayment()
  }

  const confirmPayment = () => {
    done = total
    payment = false
    bag.clear()
  }

  async function pay(e) {
    const paymentMethod = e.detail.paymentMethod
    // create payment intent server side
    const clientSecret = await createPaymentIntent()
    let result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
    })
    if (result.error) {
      e.detail.complete('fail')
      // payment failed, notify user
      error = result.error
    } else {
      e.detail.complete('success')
      confirmPayment()
    }
  }

  let error: StripeError

  let done: number | undefined

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

  let cardElement: any
  async function createPaymentIntent() {
    const data = await post<{ clientSecret: string }>(
      `/api/stripe/payment-intent`,
      {
        amount: total,
        currency: 'usd',
      }
    )
    const { clientSecret } = data
    return clientSecret
  }

  export function fly(
    node,
    {
      delay = 0,
      duration = 600,
      easing = expoOut,
      x = '0%',
      y = '0%',
      opacity = 0,
    } = {}
  ) {
    const style = getComputedStyle(node)
    const target_opacity = +style.opacity
    const transform = style.transform === 'none' ? '' : style.transform

    const od = target_opacity * (1 - opacity)

    let xValue = +x
    let xUnit = 'px'
    const xMatch = String(x).match(/([-\d.]+)(\D+)/)
    xValue = Number(xMatch[1])
    xUnit = xMatch[2]

    let yValue = +y
    let yUnit = 'px'
    const yMatch = String(y).match(/([-\d.]+)(\D+)/)
    yValue = Number(yMatch[1])
    yUnit = yMatch[2]

    return {
      delay,
      duration,
      easing,
      css: (t, u) => `
				transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${
        (1 - t) * yValue
      }${yUnit});
				opacity: ${target_opacity - od * u}`,
    }
  }

  let details: BagItem | undefined

  let fonts: { name: string; url: string }[] = []

  $: if (details && products[details?.productSlug]) {
    const p = products[details.productSlug]
    fonts = Object.entries(details.modifiers)
      .map(([mId, m]) => ({
        modifier: m.modifier || p.modifiers.find((m) => m.id == mId),
        item: (m.modifier || p.modifiers.find((m) => m.id == mId)).items.find(
          (i) => i.id === m.itemId
        ),
      }))
      .filter(({ modifier }) => modifier.type === 'font')
      .map(({ item }) => ({
        name: item?.name,
        url: item?.meta?.web
          ? (item?.meta?.url as string)
          : `/api/fontface?name=${encodeURIComponent(
              item?.name
            )}&src=${encodeURIComponent(item?.meta?.url)}`,
      }))
  }

  const paymentRequest = {
    country: 'US',
    currency: 'usd',
    total: { label: 'Demo total', amount: 1099 },
    requestPayerName: true,
    requestPayerEmail: true,
  }

  $: dark = $preferences.darkMode
  $: console.log(Object.entries(details?.modifiers || {}))
</script>

<svelte:head>
  {#each fonts as f}
    <link href={f.url} rel="stylesheet" />
  {/each}
</svelte:head>

{#if details}
  {@const p = products ? products[details.productSlug] : null}
  <div
    class="flex h-full w-full top-0 z-9999 fixed items-center justify-center"
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => (details = undefined)}
      transition:fade={{ duration: 300, easing: expoOut }}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 w-8/10 relative dark:bg-gray-900"
      in:scale|local={{
        start: 0.6,
        duration: 1000,
        opacity: 1,
        easing: elasticOut,
      }}
      out:scale|local={{
        start: 0.2,
        duration: 300,
        easing: expoOut,
      }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Details
        </h4>
        <button on:click={() => (details = undefined)}><Close24 /></button>
      </div>
      <div
        class="h-full grid gap-4 grid-cols-1 items-start overflow-auto lg:grid-cols-2"
      >
        {#if p.template && p.type === 'template'}
          <TemplatePreview
            watermark
            template={{
              ...(p?.template || {}),
              fields: getTemplateFieldsFromModifiers(p, details.modifiers),
            }}
            mockups={p.meta?.mockups}
          />
        {/if}
        <div class="flex flex-col space-y-4 w-full">
          <div class="flex flex-col space-y-2 items-start">
            <h3 class="font-bold font-title text-black text-xl dark:text-white">
              {p.name}
            </h3>
            <p class="font-bold text-black text-2xl dark:text-white">
              ${p.price.toLocaleString()} <span class="text-base">/ unit</span>
            </p>
            <p class="font-bold text-black text-base dark:text-white">
              Total: ${getTotalFromProductModifiers(
                p,
                details.modifiers
              ).toLocaleString()}
            </p>
          </div>
          <div class="flex flex-col space-y-2">
            {#each Object.entries(details?.modifiers || {}) as [mId, m]}
              {@const modifier =
                m.modifier || p.modifiers.find((m) => m.id == mId)}
              {@const itemName = modifier.name}
              {@const item = modifier.items.find((i) => i.id === m.itemId)}
              <div class="flex flex-col space-y-1 w-full lg:w-1/3">
                <div
                  class="font-bold font-title text-black text-xs dark:text-white"
                >
                  {itemName}:
                </div>
                {#if modifier.type === 'select'}
                  <p class="text-xs">
                    {m.value}
                    {item?.cost
                      ? ` - ${
                          !item?.percentage ? '$' : ''
                        }${item?.cost?.toLocaleString('en', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}${item?.percentage ? '%' : ''}`
                      : ''}
                  </p>
                {:else if modifier.type === 'color'}
                  <div class="flex space-x-2 items-center">
                    <div
                      class="rounded pb-full border-2 h-8 w-full transform w-8 duration-200 dark:border-gray-600"
                      use:squareratio
                      style="background-color: {m.value || 'black'}"
                    />
                    <div class="text-xs">
                      {item?.meta?.name}
                    </div>
                  </div>
                {:else if modifier.type === 'toggle'}
                  <p class="text-xs">
                    {m.value ? 'Yes' : 'No'}
                  </p>
                {:else if modifier.type === 'font'}
                  {#if item}
                    <div class="text-xl" style={`font-family: "${item?.name}"`}>
                      {item?.name}
                    </div>
                  {:else}
                    <p class="text-xs">N/A</p>
                  {/if}
                {:else if modifier.type === 'text'}
                  <p class="text-xs">
                    {m.value || 'N/A'}
                  </p>
                {:else if modifier.type === 'upsell'}
                  <div class="flex flex-col space-y-2 w-full">
                    {#each m?.itemIds || [] as id}
                      {@const i = modifier.items.find((i) => i.id === id)}
                      <div
                        class="border rounded-lg w-full relative dark:border-gray-700"
                      >
                        <div
                          class="flex flex-col h-full space-y-2 p-2 justify-between"
                        >
                          <div class="flex flex-col space-y-2">
                            <div
                              class="rounded-lg bg-gray-100 w-auto overflow-hidden pointer-events-none select-none dark:bg-gray-700"
                            >
                              <div
                                class="flex w-full p-2 items-center justify-center aspect-square"
                              >
                                <Image
                                  options={{
                                    progressive: true,
                                    o: 'png',
                                    rs: {
                                      s: '480x480',
                                      m: 'embed',
                                      b: '000000.0',
                                    },
                                  }}
                                  src={i.meta?.image}
                                  class="rounded object-cover w-full aspect-square"
                                />
                              </div>
                            </div>
                            <div class="flex flex-col">
                              <h3 class="font-bold text-sm">{i.name}</h3>
                              {#if i.meta.description}
                                <p
                                  class="text-sm leading-none pb-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                                >
                                  {i.meta?.description}
                                </p>
                              {/if}
                            </div>
                          </div>
                          <p class="font-bold text-right text-lg">
                            {i.cost < 0 ? '-' : ''}{!i.percentage
                              ? '$'
                              : ''}{Math.abs(i.cost)}{i.percentage ? '%' : ''}
                          </p>
                        </div>
                      </div>
                    {:else}
                      <p class="text-xs">N/A</p>
                    {/each}
                  </div>
                {:else if modifier.type === 'image'}
                  {#if item}
                    <div
                      class="rounded-lg bg-gray-100 w-full overflow-hidden pointer-events-none select-none dark:bg-gray-700"
                    >
                      <div
                        class="flex w-full p-2 items-center justify-center aspect-square"
                        use:squareratio
                      >
                        <Image
                          options={{
                            progressive: true,
                            o: 'png',
                            rs: {
                              s: '480x480',
                              m: 'embed',
                              b: '000000.0',
                            },
                          }}
                          src={item?.meta?.image}
                          class="rounded object-cover w-full aspect-square"
                        />
                      </div>
                    </div>
                  {:else}
                    <p class="text-xs">N/A</p>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if checkout}
  <form
    on:submit|preventDefault={submit}
    class="bg-white border-l flex-grow h-full shadow-xl top-0 ease-out right-0 z-100 fixed sm:w-1/2 <sm:w-full lg:w-1/3 dark:bg-gray-800 dark:border-gray-700"
    style="will-change: transform"
    transition:fly|local={{ x: '100%', opacity: 1, duration: 400 }}
  >
    <div class="flex flex-col h-full space-y-4 p-4 overflow-y-auto">
      <div class="flex space-x-4 items-center">
        <button
          type="reset"
          class="transform transition-transform duration-200 hover:scale-90"
          on:click={() => {
            checkout = false
            payment = false
            done = undefined
          }}
        >
          <ChevronLeft24 />
        </button>
        <div class="font-title font-bold text-2xl">Checkout</div>
      </div>
      {#if done !== undefined}
        <div
          class="flex flex-col h-full space-y-4 w-full items-center justify-center"
        >
          <div
            class="w-4/10 aspect-square"
            use:squareratio
            in:scale={{
              easing: elasticOut,
              start: 0,
              duration: 800,
              opacity: 1,
            }}
          >
            <CheckmarkFilled32 class="h-full w-full text-green-500" />
          </div>
          <p
            class="font-bold text-center text-2xl"
            in:fly={{
              delay: 200,
              duration: 400,
              y: '1.5rem',
            }}
          >
            Thank you!
          </p>
          <p
            class="font-bold text-center"
            in:fly={{
              delay: 300,
              duration: 400,
              y: '1.5rem',
            }}
          >
            Your checkout for ${done.toLocaleString('en', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} was sucesfully payed
          </p>
        </div>
      {:else}
        <div
          class="divide-y border rounded rounded-lg flex flex-col w-full dark:divide-gray-600 dark:border-gray-600"
        >
          {#if !payment}
            <div
              class="flex space-x-2 w-full p-2 items-center justify-between"
              transition:slide|local={{ duration: 400, easing: expoOut }}
            >
              <input
                type="text"
                placeholder="Apply coupon code"
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
              />
              <button
                class="rounded flex font-bold space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xs py-2 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105"
                style="will-change: transform"
                on:click={() => (checkout = true)}
              >
                Apply
              </button>
            </div>
          {/if}
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

        <div
          class="border rounded rounded-lg flex flex-col space-y-4 w-full p-2 dark:divide-gray-600 dark:border-gray-600"
        >
          <div
            class="flex space-x-2 w-full items-center"
            on:click={() => (payment = false)}
            class:cursor-pointer={payment}
            title="Change billing details"
            use:tooltip={{ show: payment }}
          >
            <div
              class="rounded-full flex font-bold font-title bg-[rgb(113,3,3)] h-8 shadow text-xs text-white w-8 items-center justify-center"
            >
              1
            </div>
            <div class="font-bold font-title text-xs">Shipping</div>
          </div>
          {#if !payment}
            <div
              class="flex flex-col space-y-2"
              transition:slide|local={{ duration: 400, easing: expoOut }}
            >
              <div class="flex space-x-3">
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="Ex. juan@gmail.com"
                    required
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex. +1 XXXXXX"
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
              </div>
              <div class="flex space-x-3">
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId"
                    >First name *</label
                  >
                  <input
                    type="text"
                    required
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId"
                    >Last name</label
                  >
                  <input
                    type="text"
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
              </div>
              <div class="flex flex-col w-full">
                <label class="font-bold text-xs mb-2 block" for="fieldId">
                  Country/Region *
                </label>
                <select
                  class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="" hidden />
                  {#each countries as country}
                    <option value={country.code}>{country.name}</option>
                  {/each}
                </select>
              </div>
              <div class="flex space-x-3">
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId">
                    Province/State *
                  </label>
                  <input
                    type="text"
                    required
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
              </div>
              <div class="flex space-x-3">
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId"
                    >City *</label
                  >
                  <input
                    required
                    type="text"
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
                <div class="flex flex-col w-full">
                  <label class="font-bold text-xs mb-2 block" for="fieldId"
                    >ZIP/Postal code *</label
                  >
                  <input
                    type="text"
                    required
                    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  />
                </div>
              </div>
            </div>
          {/if}
        </div>
        <div
          class="border rounded rounded-lg flex flex-col space-y-4 w-full p-2 dark:divide-gray-600 dark:border-gray-600"
        >
          <div class="flex space-x-2 w-full items-center">
            <div
              class="border rounded-full flex font-bold font-title h-8 text-xs w-8 items-center justify-center dark:border-gray-600"
              class:bg-[rgb(113,3,3)]={payment}
              class:text-white={payment}
            >
              2
            </div>
            <div class="font-bold font-title text-xs">Billing</div>
          </div>
          {#if stripe && payment}
            <StripeContainer {stripe}>
              <div
                class="border rounded rounded-lg flex flex-col space-y-2 w-full p-2 dark:border-gray-600"
                in:scale|local={{
                  duration: 600,
                  start: 0.2,
                  easing: expoOut,
                  delay: 200,
                }}
                out:slide|local={{
                  duration: 400,
                  easing: expoOut,
                }}
                style="will-change: transform"
              >
                <div class="flex flex-col w-full">
                  <div class="flex mb-2 w-full items-center justify-between">
                    <div class="font-bold text-xs block">
                      Pay with a credit card
                    </div>
                  </div>
                  {#if error}
                    <div
                      class="text-xs mb-2 text-red-500 block"
                      transition:slide|local={{
                        duration: 400,
                        easing: expoOut,
                      }}
                    >
                      {error.message}
                    </div>
                  {/if}
                  <CardNumber
                    bind:element={cardElement}
                    classes={{ base: 'stripe-input' }}
                    style={{ base: { color: dark ? 'white' : undefined } }}
                  />
                </div>
                <div class="flex space-x-2">
                  <CardExpiry
                    classes={{ base: 'stripe-input' }}
                    style={{ base: { color: dark ? 'white' : undefined } }}
                  />
                  <CardCvc
                    classes={{ base: 'stripe-input' }}
                    style={{ base: { color: dark ? 'white' : undefined } }}
                  />
                  <button
                    class="rounded flex font-bold ml-auto space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
                    style="will-change: transform"
                  >
                    Pay
                  </button>
                </div>
              </div>
              <div class="flex w-full">
                <PaymentRequestButton
                  paymentRequest={{
                    country: 'US',
                    currency: 'usd',
                    total: {
                      label: 'Total',
                      amount: Math.trunc(total * 100),
                    },
                    requestPayerName: true,
                    requestPayerEmail: true,
                  }}
                  classes={{ base: 'w-full' }}
                  on:paymentmethod={pay}
                />
              </div>
              <div class="flex w-full" id="paypal-button" />
            </StripeContainer>
          {/if}
        </div>
        {#if !payment}
          <button
            class="rounded flex font-bold ml-auto space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
            style="will-change: transform"
          >
            Go to payment
          </button>
        {/if}
      {/if}
    </div>
  </form>
{/if}

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
                        bag.setItem(
                          p,
                          item.modifiers,
                          Math.max(
                            p?.minQuantity || 1,
                            $bag[item.idx].quantity - 1
                          )
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
                          Math.max(
                            p?.minQuantity || 1,
                            $bag[item.idx].quantity + 1
                          )
                        )}
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
                      bag.delete(p, item.modifiers)
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
            payment = false
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

  :global(.stripe-input) {
    @apply bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none;
  }

  :global(.dark .stripe-input) {
    @apply bg-gray-700 border-gray-600;
  }

  :global(.stripe-input:focus) {
    @apply outline-none;
  }
</style>
