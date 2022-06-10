<script lang="ts">
  import { page } from '$app/stores'
  import { bag, type BagItem } from '$lib'
  import { get, post } from '$lib/api'
  import { tooltip } from '$lib/components/tooltip'
  import {
    CardNumber,
    Container as StripeContainer,
    CardCvc,
    CardExpiry,
  } from 'svelte-stripe'

  import type { Product } from '$lib/db'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import {
    Add16,
    ArrowRight16,
    ArrowRight24,
    CheckmarkFilled32,
    ChevronLeft24,
    Subtract16,
    TrashCan16,
  } from 'carbon-icons-svelte'

  import { loadStripe, type Stripe, type StripeError } from '@stripe/stripe-js'

  import { onMount } from 'svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import { getCountries } from '$lib/utils/countries'
  import { expoOut } from 'svelte/easing'
  import { scale, slide } from 'svelte/transition'

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

  const submit = async () => {
    if (!payment) {
      payment = true
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
    checkout = false
    payment = false
    bag.clear()
  }

  let error: StripeError

  let done: number | undefined = 1

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
</script>

{#if checkout}
  <form
    on:submit|preventDefault={submit}
    class="bg-white border-l flex-grow h-full shadow-xl transform top-0 ease-out right-0 z-100 duration-600 fixed sm:w-1/2 <sm:w-full lg:w-1/3 dark:bg-gray-800 dark:border-gray-700"
    style="will-change: transform"
    transition:fly|local={{ x: '100%', opacity: 1, duration: 400 }}
  >
    <div class="flex flex-col h-full space-y-6 p-4 overflow-y-auto">
      <div class="flex space-x-4 items-center">
        <button
          type="reset"
          class="transform transition-transform duration-200 hover:scale-90"
          on:click={() => {
            checkout = false
          }}
        >
          <ChevronLeft24 />
        </button>
        <div class="font-title font-bold text-2xl">Checkout</div>
      </div>
      {#if done === undefined}
        <CheckmarkFilled32 class="text-green-500" />
      {:else}
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
        <StripeContainer {stripe}>
          {#if payment}
            <div
              class="border rounded rounded-lg flex flex-col space-y-2 w-full p-2 dark:border-gray-600"
              transition:scale|local={{
                duration: 600,
                start: 0.2,
                easing: expoOut,
                delay: 200,
              }}
              style="will-change: transform"
            >
              <div class="flex flex-col w-full">
                <div class="font-bold text-xs mb-2 block">
                  Pay with a credit card
                </div>
                {#if error}
                  <div
                    class="text-xs mb-2 text-red-500 block"
                    transition:slide|local={{ duration: 400, easing: expoOut }}
                  >
                    {error.message}
                  </div>
                {/if}
                <CardNumber
                  bind:element={cardElement}
                  classes={{ base: 'stripe-input' }}
                />
              </div>
              <div class="flex space-x-2">
                <CardExpiry classes={{ base: 'stripe-input' }} />
                <CardCvc classes={{ base: 'stripe-input' }} />
              </div>
            </div>
          {/if}
        </StripeContainer>
        <button
          class="rounded flex font-bold ml-auto space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
          style="will-change: transform"
        >
          {payment ? 'Pay' : 'Go to payment'}
        </button>
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
  {#if items?.length}
    <div class="flex-grow w-full overflow-x-auto">
      <div
        class="divide-y border rounded-lg flex flex-col w-full max-h-60vh relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
      >
        {#each items as item (item.idx)}
          {@const p = products ? products[item.productSlug] : null}
          <div
            class="flex p-4  text-gray-500 justify-between sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
          >
            <div
              class="flex items-center sm:space-x-4 <sm:flex-col <sm:space-y-4"
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
                <p
                  class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white"
                >
                  {p?.name}
                </p>
              </div>
            </div>
            <div class="flex flex-col space-y-1">
              <p class="font-bold text-xs text-black dark:text-white">Cost</p>
              <p class="font-bold text-sm">
                ${p?.price.toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} / unit
              </p>
            </div>
            <div class="flex flex-col space-y-1">
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
                      Math.max(p?.minQuantity || 1, $bag[item.idx].quantity - 1)
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
                      Math.max(p?.minQuantity || 1, $bag[item.idx].quantity + 1)
                    )}
                >
                  <Add16 class="m-auto" />
                </button>
              </div>
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
                })} / unit
              </p>
            </div>
            <button
              class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
              title="Delete"
              on:click={() => {
                bag.delete(p, item.modifiers)
              }}
              use:tooltip
              type="button"><TrashCan16 /></button
            >
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

<style>
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
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
