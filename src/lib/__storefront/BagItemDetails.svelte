<script lang="ts">
  import { browser } from '$app/env'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import type { Product, Store } from '$lib/db'
  import type { BagItem } from '$lib/stores'
  import trpc from '$lib/trpc/client'
  import {
    createModifiersMapStore,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import type { Prisma } from '@prisma/client'
  import { Close24 } from 'carbon-icons-svelte'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { portal } from 'svelte-portal'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { fade, scale } from 'svelte/transition'
  import ModifiersControls from './ModifiersControls.svelte'

  export let item:
    | (BagItem & {
        cost?: number
      })
    | undefined
  export let store: Store

  let product: Product | undefined
  export let disabled = false

  let compiler: Worker
  let template

  onMount(async () => {
    const ModifiersWorker = await import(
      '$lib/utils/modifiers.worker?worker'
    ).then((m) => m.default)

    compiler = new ModifiersWorker()

    compiler.onmessage = ({ data }: MessageEvent<string>) => {
      template = data
    }
  })

  onDestroy(() => {
    compiler?.terminate()
  })

  $: if (item && browser) {
    trpc()
      .query('products:getBySlug', {
        productSlug: item.productSlug,
        storeSlug: store.slug,
      })
      .then((p) => {
        if (p) product = p
      })
  }

  let modifiers = createModifiersMapStore()
  const setModifiers = (value: ModifiersMap) => {
    modifiers.set(JSON.parse(JSON.stringify(value)))
  }

  $: if (product) {
    compiler?.postMessage({ product, modifiers: $modifiers })
  } else {
    template = ''
  }

  $: setModifiers((item?.modifiers as ModifiersMap) || {})

  const dispatch = createEventDispatcher<{
    change: {
      product: Product
      modifiers: ModifiersMap
      newModifiers: ModifiersMap
    }
  }>()

  const change = (
    product?: Product,
    modifiers?: ModifiersMap | Prisma.JsonValue,
    newModifiers?: ModifiersMap | Prisma.JsonValue
  ) => {
    if (!product || !modifiers || !item?.modifiers) return
    dispatch('change', {
      product,
      modifiers: modifiers as ModifiersMap,
      newModifiers: newModifiers as ModifiersMap,
    })
  }

  const close = () => {
    change(product, item?.modifiers, $modifiers)
    item = undefined
    product = undefined
    template = ''
    $modifiers = {}
  }
</script>

{#if item && product}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-lg"
    transition:fade={{ duration: 400, easing: expoOut }}
    use:portal
  >
    <div class="bg-black h-full w-full opacity-70 absolute" on:click={close} />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 w-9/10 relative lg:w-8/10 dark:bg-gray-900"
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Details
        </h4>
        <button on:click={close}><Close24 /></button>
      </div>
      <div
        class="h-full grid gap-4 grid-cols-1 items-start overflow-auto lg:grid-cols-2"
      >
        {#if product}
          <div class="lg:top-0 lg:sticky <lg:relative">
            {#if product.type.startsWith('template')}
              <TemplatePreview
                watermark
                template={{
                  ...(template || {}),
                }}
                mockups={product.meta?.mockups}
              />
            {:else}
              <div
                class="rounded-lg flex h-full w-full absolute aspect-square skeleton"
              />
            {/if}
          </div>
        {/if}
        <div class="flex flex-col space-y-4 w-full">
          {#if product}
            <div class="flex flex-col space-y-2 items-start">
              <h3
                class="font-bold font-title text-black text-xl dark:text-white"
              >
                {product.name || ''}
              </h3>
              <p class="font-bold text-black text-2xl dark:text-white">
                ${(item.cost ?? product.price).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span class="text-base">/ unit</span>
              </p>
              <p class="font-bold text-black text-base dark:text-white">
                Total: ${(product
                  ? getTotalFromProductModifiers(product, $modifiers, item.cost)
                  : 0
                ).toLocaleString()}
              </p>
            </div>
            <div class="w-full lg:w-7/10">
              {#if product}
                <ModifiersControls
                  {product}
                  bind:modifiers={$modifiers}
                  {disabled}
                />
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
