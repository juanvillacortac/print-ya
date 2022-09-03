<script context="module" lang="ts">
  export type CheckoutEvent = {
    amount: number
    currency: string
    method: 'stripe' | 'paypal'
  }
  const a = null
</script>

<script lang="ts">
  import { CheckmarkFilled32, Close24, Hourglass32 } from 'carbon-icons-svelte'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { loadStripe, type Stripe, type StripeError } from '@stripe/stripe-js'
  import { createEventDispatcher, onMount, tick } from 'svelte'
  import trpc from '$lib/trpc/client'
  import {
    loadScript,
    type PayPalButtonsComponent,
    type PayPalNamespace,
  } from '@paypal/paypal-js'
  import { squareratio } from '$lib/actions/aspectratio'
  import { fade, scale, slide } from 'svelte/transition'
  import { tooltip } from '$lib/components/tooltip'
  import { getCountries } from '$lib/utils/countries'
  import {
    CardNumber,
    Container as StripeContainer,
    CardCvc,
    CardExpiry,
    PaymentRequestButton,
  } from 'svelte-stripe'
  import type { Order, Product } from '@shackcart/db'
  import type { BagItem } from '$lib'
  import { customer, layoutData, redisWritable } from '$lib/stores'
  import { getTotalFromProductModifiers } from '@shackcart/db/dist/utils'

  const countries = getCountries()

  let stripe: Stripe | null
  let paypal: PayPalNamespace | null

  const stripeKey = redisWritable<string | undefined>(
    undefined,
    `stripe:public-key:${$layoutData.store?.id}`
  )
  const paypalKey = redisWritable<string | undefined>(
    undefined,
    `paypal:client-id:${$layoutData.store?.id}`
  )

  onMount(async () => {
    stripe = await loadStripe(
      'pk_test_51I7RL6J2WplztltUdJyNQb1xLxVbXhB6QUu3R753Vuxq1xatD8cpU49K5m3q0fPfnK4ayhMPfg8xjLxxbrVqHjG600IC5Q2yzL'
    )
    paypal = await loadScript({
      'client-id':
        'AeFkK76hZkhCrPuLpM1yAiCHXSzro1INVTH2S0WFmzuWekXPCIh4tdAGW569cRVRGIoLIUdOwrggqo-T',
    })
  })

  export let open = false
  export let dark = false

  function setOrderData() {
    if (!order) return
    completedSteps = {
      billing: Boolean(order.billingData?.email),
      shipping: Boolean(order.shippingData?.email),
      payment: false,
    }
    billing = order.billingData
    shipping = completedSteps.shipping ? order.shippingData : shipping
    mergeAddress = !completedSteps.shipping
    step = completedSteps.shipping
      ? completedSteps.billing
        ? 'payment'
        : 'shipping'
      : 'billing'
  }

  $: if (open) {
    setOrderData()
  }

  let payment = false
  let done: number | null | undefined
  export let products: Record<string, Product>
  export let items: BagItem[]
  export let order: Order | null = null
  let placedOrder: Order | undefined

  let billing: Record<string, any> = {}
  let shipping: Record<string, any> = {}

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

  const createPaymentIntent = () =>
    trpc().mutation('stores:payment:createStripeIntent', {
      amount: total,
      currency: 'usd',
    })

  let cardElement: any
  let paypalLoaded = false

  let completedSteps: Record<typeof step, boolean> = {
    billing: false,
    shipping: false,
    payment: false,
  }

  let canUseAutoPayment: boolean | undefined

  const createPaypalButton = (amount: number) =>
    paypal?.Buttons!({
      style: {
        color: 'blue',
        shape: 'rect',
        height: 40,
        label: 'buynow',
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
        waiting = true
        return actions?.order
          ?.capture()
          .then(async (details) => {
            if (order) {
              confirmPayment({
                amount: total,
                currency: 'usd',
                method: 'paypal',
              })
            }
          })
          .finally(() => {
            waiting = false
          })!
      },
      onError: function (err) {
        // Log error if something goes wrong during approval
        alert('Something went wrong')
        console.log('Something went wrong', err)
        waiting = false
      },
    })

  let paypalButtonComponent: PayPalButtonsComponent | undefined
  let paypalButtonRef: HTMLDivElement | undefined

  const updateOrder = async () => {
    waiting = true
    const billingData = Object.keys(billing).length ? billing : undefined
    const shippingData = mergeAddress
      ? billingData
      : Object.keys(shipping).length
      ? shipping
      : undefined
    order = (await trpc().mutation('orders:update', {
      id: order!.id,
      billingData,
      shippingData,
      items: items.map((i, idx) => ({
        productId: products[i.productSlug].id,
        quantity: i.quantity,
        cost:
          getTotalFromProductModifiers(products[i.productSlug], i.modifiers) *
          i.quantity,
        basePrice: products[i.productSlug].price,
        modifiers: i.modifiers,
      })),
    })) as Order
    waiting = false
  }

  let waiting = false
  const submit = async () => {
    if (step !== 'payment') {
      if (order) {
        await updateOrder()
      } else {
        waiting = true
        order = await trpc().mutation('orders:create', {
          storeId: $layoutData.store!.id,
          order: {
            customerId: $customer?.id || undefined,
            status: 'pending',
            paymentMethods: [],
            fees: [],
            billingData: billing,
            items: items.map((i) => ({
              productId: products[i.productSlug].id,
              quantity: i.quantity,
              cost:
                getTotalFromProductModifiers(
                  products[i.productSlug],
                  i.modifiers
                ) * i.quantity,
              basePrice: products[i.productSlug].price,
              modifiers: i.modifiers,
            })),
          },
        })
      }
      waiting = false
      switch (step) {
        case 'billing':
          if (!completedSteps.billing) {
            completedSteps.billing = true
          }
          step = 'shipping'
          break
        case 'shipping':
          if (!completedSteps.shipping) {
            completedSteps.shipping = true
          }
          step = 'payment'
          await tick()
          paypalButtonComponent = createPaypalButton(total)
          paypalButtonComponent?.render(paypalButtonRef as HTMLElement)
          break
      }
      return
    }

    // create the payment intent server-side
    waiting = true
    try {
      const clientSecret = await createPaymentIntent()
      // confirm payment with stripe
      if (!clientSecret) {
        waiting = false
        return
      }

      const result = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })
      if (result.error) {
        // payment failed, notify user
        waiting = false
        error = result.error
        return
      }
      if (order) {
        confirmPayment({
          amount: total,
          currency: 'usd',
          method: 'stripe',
        })
      }
    } catch (err) {
      console.log(err)
      waiting = false
    }
  }

  const confirmPayment = async (event: CheckoutEvent) => {
    if (!order) {
      return
    }
    done = event.amount
    try {
      placedOrder = (await trpc().mutation('orders:update', {
        id: order?.id,
        paymentMethods: [event.method],
        status: 'paid',
        items: items.map((i, idx) => ({
          productId: products[i.productSlug].id,
          quantity: i.quantity,
          cost:
            getTotalFromProductModifiers(products[i.productSlug], i.modifiers) *
            i.quantity,
          basePrice: products[i.productSlug].price,
          modifiers: i.modifiers,
        })),
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
      }))!
    } catch (err) {
      console.error(err)
    } finally {
      waiting = false
    }
    order = null
    dispatch('checkout', event)
  }

  async function pay(e) {
    waiting = true
    const paymentMethod = e.detail.paymentMethod
    // create payment intent server side
    const clientSecret = await createPaymentIntent()
    if (!clientSecret || !stripe) {
      waiting = false
      return
    }
    let result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
    })
    waiting = false
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

  let step: 'billing' | 'shipping' | 'payment' = 'billing'

  let mergeAddress = true

  let detectingShipping = false
  const fillAddress = (mode: 'shipping' | 'billing') => {
    if (typeof navigator == 'undefined') return
    detectingShipping = true
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!pos?.coords) {
          return
        }
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        const geo = await trpc().query('utils:geocoding', coords)
        detectingShipping = false
        if (!geo) return
        let obj = mode === 'shipping' ? { ...shipping } : { ...billing }
        const data = geo.features[0]?.properties
        obj.coords = coords
        obj.country = data.country_code.toUpperCase()
        obj.city = data.city
        obj.province = data.state
        obj.zip = data.postcode
        obj.address = data.address_line1
        if (mode === 'shipping') {
          shipping = { ...obj }
        } else {
          billing = { ...obj }
        }
        tick()
        // shipping.country = geo.countryCode
      },
      (err) => {
        console.log(err)
        detectingShipping = false
      },
      {
        enableHighAccuracy: true,
      }
    )
  }

  const changeStep = async (to: typeof step) => {
    if (to == 'payment' && completedSteps.billing && completedSteps.shipping) {
      step = to
      tick().then(() => {
        paypalButtonComponent = createPaypalButton(total)
        paypalButtonComponent?.render(paypalButtonRef as HTMLElement)
      })
      return
    }
    if (completedSteps[to]) {
      await updateOrder()
      paypalButtonComponent?.close()
      step = to
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
      {#if waiting}
        <div
          class="bg-white flex h-full w-full z-110 absolute items-center justify-center !bg-opacity-50 dark:bg-gray-900"
          transition:fade={{ duration: 200 }}
        >
          <Hourglass32
            class="h-48px w-48px roll !animate-loop !animate-duration-1500"
          />
        </div>
      {/if}
      <div class="flex flex-col h-full space-y-4 p-4 overflow-y-auto">
        <div class="flex space-x-4 items-center">
          <button
            type="reset"
            class="transform transition-transform duration-200 hover:scale-80"
            on:click={() => {
              open = false
              payment = false
              done = undefined
            }}
          >
            <Close24 />
          </button>
          <div class="font-title font-bold text-2xl">Checkout</div>
        </div>
        {#if (done || done == 0) && placedOrder}
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
              class="font-bold text-center w-9/10"
              in:fly={{
                delay: 300,
                duration: 400,
                y: '1.5rem',
              }}
            >
              Your order <span
                class="rounded font-mono font-bold bg-gray-700 text-xs leading-none p-[0.2rem]"
                >#{placedOrder.id}</span
              >
              for ${done.toLocaleString('en', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} was succesfully placed
            </p>
            <p
              class="text-sm text-center text-gray-500 w-9/10"
              in:fly={{
                delay: 400,
                duration: 400,
                y: '1.5rem',
              }}
            >
              We have just sent an email to <span class="font-bold"
                >{placedOrder.customer?.email ||
                  placedOrder.billingData.email}</span
              >
              with details about the order. You can also track the order
              <a
                class="text-blue-500 hover:underline"
                href="/account/orders/{placedOrder.id}{placedOrder.token
                  ? `?token=${placedOrder.token}`
                  : ''}">here</a
              >
            </p>
          </div>
        {:else}
          <div
            class="divide-y border rounded rounded-lg flex flex-col w-full dark:divide-gray-600 dark:border-gray-600"
          >
            {#if step !== 'payment'}
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
                  class="bg-$sc-color-primary rounded flex font-bold space-x-2 shadow text-white text-xs py-2 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105"
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
          </div>

          <div
            class="border rounded rounded-lg flex flex-col space-y-4 w-full p-2 dark:divide-gray-600 dark:border-gray-600"
          >
            <div
              class="flex space-x-2 w-full items-center"
              on:click={() => changeStep('billing')}
              class:cursor-pointer={step != 'billing' && completedSteps.billing}
              title="Change billing details"
              use:tooltip={{
                show: step != 'billing' && completedSteps.billing,
              }}
            >
              <div
                class="border rounded-full flex font-bold font-title border-gray-300 h-8 text-xs w-8 items-center justify-center dark:border-gray-600"
                class:!border-transparent={completedSteps.billing ||
                  step === 'billing'}
                class:text-white={completedSteps.billing || step === 'billing'}
                class:bg-$sc-color-primary={completedSteps.billing ||
                  step === 'billing'}
              >
                1
              </div>
              <div class="font-bold font-title text-xs">Billing</div>
            </div>
            {#if step === 'billing'}
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
                      placeholder="Ex. example@domain.com"
                      required
                      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                      bind:value={billing.email}
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
                      bind:value={billing.phone}
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
                      bind:value={billing.firstName}
                    />
                  </div>
                  <div class="flex flex-col w-full">
                    <label class="font-bold text-xs mb-2 block" for="fieldId"
                      >Last name</label
                    >
                    <input
                      type="text"
                      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                      bind:value={billing.lastName}
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
                    bind:value={billing.country}
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
                      bind:value={billing.province}
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
                      bind:value={billing.address}
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
                      bind:value={billing.city}
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
                      bind:value={billing.zip}
                    />
                  </div>
                </div>
                <button
                  class="rounded flex font-bold space-x-2 border-blue-500 border-2 shadow text-xs text-center w-full py-2 px-4 text-blue-500 duration-200 justify-center items-center disabled:cursor-not-allowed disabled:opacity-75 hover:not-disabled:(bg-blue-500 text-white) "
                  type="button"
                  style="will-change: transform"
                  disabled={detectingShipping}
                  on:click={() => fillAddress('billing')}
                >
                  {detectingShipping
                    ? 'Detecting...'
                    : 'Detect address automatically'}
                </button>
              </div>
            {/if}
          </div>

          <div
            class="border rounded rounded-lg flex flex-col space-y-4 w-full p-2 dark:divide-gray-600 dark:border-gray-600"
          >
            <div
              class="flex space-x-2 w-full items-center"
              on:click={() => changeStep('shipping')}
              class:cursor-pointer={step != 'shipping' &&
                completedSteps.shipping}
              title="Change shipping details"
              use:tooltip={{
                show: step != 'shipping' && completedSteps.shipping,
              }}
            >
              <div
                class="border rounded-full flex font-bold font-title border-gray-300 h-8 text-xs text-white w-8 items-center justify-center dark:border-gray-600"
                class:!border-transparent={completedSteps.shipping ||
                  step === 'shipping'}
                class:text-white={completedSteps.shipping ||
                  step === 'shipping'}
                class:bg-$sc-color-primary={completedSteps.shipping ||
                  step === 'shipping'}
              >
                2
              </div>
              <div class="font-bold font-title text-xs">Shipping</div>
            </div>
            {#if step === 'shipping'}
              <div
                class="flex flex-col space-y-4 w-full"
                transition:slide|local={{ duration: 400, easing: expoOut }}
              >
                <label class="flex font-bold space-x-2 text-xs items-center">
                  <span> Use billing address </span>
                  <input type="checkbox" bind:checked={mergeAddress} />
                </label>
                {#if !mergeAddress}
                  <div
                    class="flex flex-col space-y-2"
                    transition:slide|local={{ duration: 400, easing: expoOut }}
                  >
                    <div class="flex space-x-3">
                      <div class="flex flex-col w-full">
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId"
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          placeholder="Ex. example@domain.com"
                          required
                          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                          bind:value={shipping.email}
                        />
                      </div>
                      <div class="flex flex-col w-full">
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId"
                        >
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
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId">First name *</label
                        >
                        <input
                          type="text"
                          required
                          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                          bind:value={shipping.firstName}
                        />
                      </div>
                      <div class="flex flex-col w-full">
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId">Last name</label
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
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId"
                        >
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
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId"
                        >
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
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId">City *</label
                        >
                        <input
                          required
                          type="text"
                          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                          bind:value={shipping.city}
                        />
                      </div>
                      <div class="flex flex-col w-full">
                        <label
                          class="font-bold text-xs mb-2 block"
                          for="fieldId">ZIP/Postal code *</label
                        >
                        <input
                          type="text"
                          required
                          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                          bind:value={shipping.zip}
                        />
                      </div>
                    </div>
                    <button
                      class="rounded flex font-bold space-x-2 border-blue-500 border-2 shadow text-xs text-center w-full py-2 px-4 text-blue-500 duration-200 justify-center items-center disabled:cursor-not-allowed disabled:opacity-75 hover:not-disabled:(bg-blue-500 text-white) "
                      type="button"
                      style="will-change: transform"
                      disabled={detectingShipping}
                      on:click={() => fillAddress('shipping')}
                    >
                      {detectingShipping
                        ? 'Detecting...'
                        : 'Detect address automatically'}
                    </button>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          <div
            class="border rounded rounded-lg flex flex-col w-full p-2 dark:divide-gray-600 dark:border-gray-600"
          >
            <div
              class="flex space-x-2 w-full items-center"
              on:click={() => changeStep('payment')}
              class:cursor-pointer={step != 'payment' &&
                completedSteps.billing &&
                completedSteps.shipping}
              title="Return to payment"
              use:tooltip={{
                show:
                  step != 'payment' &&
                  completedSteps.shipping &&
                  completedSteps.billing,
              }}
            >
              <div
                class="border rounded-full flex font-bold font-title border-gray-300 h-8 text-xs text-white w-8 items-center justify-center dark:border-gray-600"
                class:!border-transparent={completedSteps.payment ||
                  step === 'payment'}
                class:text-white={completedSteps.payment || step === 'payment'}
                class:bg-$sc-color-primary={completedSteps.payment ||
                  step === 'payment'}
              >
                3
              </div>
              <div class="font-bold font-title text-xs">Payment</div>
            </div>
            {#if stripe && step === 'payment'}
              <StripeContainer {stripe}>
                <div
                  class="border rounded rounded-lg flex flex-col space-y-2 mt-4 w-full p-2 dark:border-gray-600"
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
                      class="bg-$sc-color-primary rounded flex font-bold ml-auto space-x-2 shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
                      style="will-change: transform"
                    >
                      Pay
                    </button>
                  </div>
                </div>
                <div class="flex w-full" class:mt-2={canUseAutoPayment}>
                  <PaymentRequestButton
                    bind:canMakePayment={canUseAutoPayment}
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
                <div class="flex mt-2 w-full" bind:this={paypalButtonRef} />
              </StripeContainer>
            {/if}
          </div>
          {#if step !== 'payment'}
            <button
              class="bg-$sc-color-primary rounded flex font-bold ml-auto space-x-2 shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
              style="will-change: transform"
            >
              Next step
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

  @keyframes rollIn {
    from {
      opacity: 0;
      -webkit-transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);
      transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);
    }
    to {
      opacity: 1;
      -webkit-transform: translate3d(0, 0, 0);
      transform: translate3d(0, 0, 0);
    }
  }
  @-webkit-keyframes global-roll {
    0% {
      transform: rotate3d(0, 0, 1, -180deg);
    }
    50% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate3d(0, 0, 1, 180deg);
    }
  }
  :global(.roll) {
    -webkit-animation: global-roll;
    animation: global-roll;
  }
</style>
