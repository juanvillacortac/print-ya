<script context="module" lang="ts">
  export type CheckoutEvent = {
    amount: number
    currency: string
    method: 'stripe' | 'paypal'
  }
</script>

<script lang="ts">
  import { CheckmarkFilled32, ChevronLeft24 } from 'carbon-icons-svelte'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { loadStripe, type Stripe, type StripeError } from '@stripe/stripe-js'
  import { createEventDispatcher, onMount } from 'svelte'
  import trpc from '$lib/trpc/client'
  import { loadScript } from '@paypal/paypal-js'
  import { squareratio } from '$lib/actions/aspectratio'
  import { scale, slide } from 'svelte/transition'
  import { tooltip } from '$lib/components/tooltip'
  import { getCountries } from '$lib/utils/countries'
  import {
    CardNumber,
    Container as StripeContainer,
    CardCvc,
    CardExpiry,
    PaymentRequestButton,
  } from 'svelte-stripe'
  import type { Order, Product } from '$lib/db'
  import type { BagItem } from '$lib'
  import { getTotalFromProductModifiers } from '$lib/utils/modifiers'
  import { page } from '$app/stores'

  const countries = getCountries()

  let stripe: Stripe | null
  onMount(async () => {
    stripe = await loadStripe(
      'pk_test_51I7RL6J2WplztltUdJyNQb1xLxVbXhB6QUu3R753Vuxq1xatD8cpU49K5m3q0fPfnK4ayhMPfg8xjLxxbrVqHjG600IC5Q2yzL'
    )
  })

  export let open = false
  export let dark = false

  let payment = false
  let done: number | null | undefined
  export let products: Record<string, Product>
  export let items: BagItem[]
  let order: Order | undefined

  let shipping: Record<string, string> = {}

  $: total = items
    .map((v) => ({
      product: products ? products[v.productSlug] : null,
      modifiers: v.modifiers,
      quantity: v.quantity,
    }))
    .map(({ product, modifiers, quantity }) =>
      product ? getTotalFromProductModifiers(product, modifiers) * quantity : 0
    )
    .reduce((a, b) => a + b, 0)

  let dispatch = createEventDispatcher<{
    checkout: CheckoutEvent
  }>()

  function fly(
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
    xValue = Number(xMatch ? xMatch[1] : 0)
    xUnit = xMatch ? xMatch[2] : xUnit

    let yValue = +y
    let yUnit = 'px'
    const yMatch = String(y).match(/([-\d.]+)(\D+)/)
    yValue = Number(yMatch ? yMatch[1] : 0)
    yUnit = yMatch ? yMatch[2] : yUnit

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

  const createPaymentIntent = async () =>
    await trpc().mutation('stores:payment:createStripeIntent', {
      amount: total,
      currency: 'usd',
    })

  let cardElement: any
  let paypalLoaded = false

  const createPaypal = (el: string | HTMLElement, amount: number) =>
    loadScript({
      'client-id':
        'AeFkK76hZkhCrPuLpM1yAiCHXSzro1INVTH2S0WFmzuWekXPCIh4tdAGW569cRVRGIoLIUdOwrggqo-T',
    }).then((paypal) => {
      paypal?.Buttons!({
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
          return actions?.order?.capture().then(async (details) => {
            if (order) {
              confirmPayment({
                amount: total,
                currency: 'usd',
                method: 'paypal',
              })
            }
          })!
        },
        onError: function (err) {
          // Log error if something goes wrong during approval
          alert('Something went wrong')
          console.log('Something went wrong', err)
        },
      })
        .render(el)
        .then(() => {
          paypalLoaded = true
        })
    })

  const submit = async () => {
    if (!payment) {
      if (order) {
        order = (await trpc().mutation('orders:update', {
          id: order.id,
          billingData: shipping,
          items: items.map((i) => ({
            productId: products[i.productSlug].id,
            quantity: i.quantity,
            cost: products[i.productSlug].price,
            modifiers: i.modifiers,
          })),
        })) as Order
      } else {
        order = await trpc().mutation('orders:create', {
          storeId: $page.stuff.store!.id,
          order: {
            status: 'pending',
            paymentMethods: [],
            fees: [],
            billingData: shipping,
            items: items.map((i) => ({
              productId: products[i.productSlug].id,
              quantity: i.quantity,
              cost: products[i.productSlug].price,
              modifiers: i.modifiers,
            })),
          },
        })
      }
      payment = true
      createPaypal('#paypal-button', total)
      return
    }

    // create the payment intent server-side
    const clientSecret = await createPaymentIntent()
    // confirm payment with stripe
    if (!clientSecret) {
      return
    }
    const result = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })
    if (result.error) {
      // payment failed, notify user
      error = result.error
      return
    }
    console.log(order)
    if (order) {
      confirmPayment({
        amount: total,
        currency: 'usd',
        method: 'stripe',
      })
    }
  }

  const confirmPayment = async (event: CheckoutEvent) => {
    if (!order) {
      return
    }
    done = event.amount
    payment = false
    await trpc().mutation('orders:update', {
      id: order?.id,
      paymentMethods: [event.method],
      status: 'paid',
      fees:
        event.method === 'stripe'
          ? [
              {
                name: 'Stripe fee',
                fixed: 0.3,
                percentage: 2.9,
              },
            ]
          : [],
    })
    order = undefined
    dispatch('checkout', event)
  }

  $: console.log(order)

  async function pay(e) {
    const paymentMethod = e.detail.paymentMethod
    // create payment intent server side
    const clientSecret = await createPaymentIntent()
    if (!clientSecret || !stripe) {
      return
    }
    let result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
    })
    if (result.error) {
      e.detail.complete('fail')
      // payment failed, notify user
      error = result.error
    } else {
      e.detail.complete('success')
      confirmPayment({
        amount: total,
        currency: 'usd',
        method: 'stripe',
      })
    }
  }

  let error: StripeError
</script>

{#if open}
  <div class="contents">
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
              open = false
              payment = false
              done = undefined
            }}
          >
            <ChevronLeft24 />
          </button>
          <div class="font-title font-bold text-2xl">Checkout</div>
        </div>
        {#if done || done == 0}
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
                  type="button"
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
                      bind:value={shipping.email}
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
                      bind:value={shipping.phone}
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
                      bind:value={shipping.firstName}
                    />
                  </div>
                  <div class="flex flex-col w-full">
                    <label class="font-bold text-xs mb-2 block" for="fieldId"
                      >Last name</label
                    >
                    <input
                      type="text"
                      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                      bind:value={shipping.lastName}
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
                    bind:value={shipping.country}
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
                      bind:value={shipping.province}
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
                      bind:value={shipping.address}
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
                      bind:value={shipping.city}
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
                      bind:value={shipping.zip}
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
  </div>
{/if}

<style>
  form :global(.stripe-input) {
    @apply bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none;
  }

  :global(.dark) form :global(.stripe-input) {
    @apply bg-gray-700 border-gray-600;
  }

  form :global(.stripe-input:focus) {
    @apply outline-none;
  }
</style>
