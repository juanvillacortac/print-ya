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
  let fields = ''

  onMount(async () => {
    const ModifiersWorker = await import(
      '$lib/utils/modifiers.worker?worker'
    ).then((m) => m.default)

    compiler = new ModifiersWorker()

    compiler.onmessage = ({ data }: MessageEvent<string>) => {
      fields = data
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
    fields = ''
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
    fields = ''
    $modifiers = {}
  }
</script>

{#if item && product}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center"
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={close}
      transition:fade={{ duration: 400, easing: expoOut }}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 w-8/10 relative dark:bg-gray-900"
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
        {#if product?.template && product?.type === 'template'}
          <div class="lg:top-0 lg:sticky <lg:relative">
            {#if product}
              <TemplatePreview
                watermark
                template={{
                  ...(product?.template || {}),
                  fields,
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
                  ? getTotalFromProductModifiers(
                      product,
                      item.modifiers,
                      item.cost
                    )
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
            <!-- <div class="flex flex-col space-y-2">
              {#each Object.entries(item?.modifiers || {}) as [mId, m]}
                {@const modifier =
                  m.modifier || product?.modifiers?.find((m) => m.id == mId)}
                {@const itemName = modifier?.name}
                {@const item = modifier?.items?.find((i) => i.id === m.itemId)}
                <div class="flex flex-col space-y-1 w-full lg:w-1/3">
                  <div
                    class="font-bold font-title text-black text-xs dark:text-white"
                  >
                    {itemName}:
                  </div>
                              <div class="flex flex-col space-y-2">
              {#each Object.entries(item?.modifiers || {}) as [mId, m]}
                {@const modifier =
                  m.modifier || product?.modifiers?.find((m) => m.id == mId)}
                {@const itemName = modifier?.name}
                {@const item = modifier?.items?.find((i) => i.id === m.itemId)}
                <div class="flex flex-col space-y-1 w-full lg:w-1/3">
                  <div
                    class="font-bold font-title text-black text-xs dark:text-white"
                  >
                    {itemName}:
                  </div>
                  {#if modifier?.type === 'select'}
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
                  {:else if modifier?.type === 'color'}
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
                  {:else if modifier?.type === 'toggle'}
                    <p class="text-xs">
                      {m.value ? 'Yes' : 'No'}
                    </p>
                  {:else if modifier?.type === 'font'}
                    {#if item}
                      <div
                        class="text-xl"
                        style={`font-family: "${item?.name}"`}
                      >
                        {item?.name}
                      </div>
                    {:else}
                      <p class="text-xs">N/A</p>
                    {/if}
                  {:else if modifier?.type === 'text'}
                    <p class="text-xs">
                      {m.value || 'N/A'}
                    </p>
                  {:else if modifier?.type === 'upsell'}
                    <div class="flex flex-col space-y-2 w-full">
                      {#each m?.itemIds || [] as id}
                        {@const i = modifier?.items?.find((i) => i.id === id)}
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
                                    src={i?.meta?.image}
                                    class="rounded object-cover w-full aspect-square"
                                  />
                                </div>
                              </div>
                              <div class="flex flex-col">
                                <h3 class="font-bold text-sm">{i?.name}</h3>
                                {#if i?.meta.description}
                                  <p
                                    class="text-sm leading-none pb-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                                  >
                                    {i?.meta?.description}
                                  </p>
                                {/if}
                              </div>
                            </div>
                            <p class="font-bold text-right text-lg">
                              {(i?.cost || 0) < 0 ? '-' : ''}{!i?.percentage
                                ? '$'
                                : ''}{Math.abs(i?.cost || 0)}{i?.percentage
                                ? '%'
                                : ''}
                            </p>
                          </div>
                        </div>
                      {:else}
                        <p class="text-xs">N/A</p>
                      {/each}
                    </div>
                  {:else if modifier?.type === 'image'}
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
            </div>{#if modifier?.type === 'select'}
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
                  {:else if modifier?.type === 'color'}
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
                  {:else if modifier?.type === 'toggle'}
                    <p class="text-xs">
                      {m.value ? 'Yes' : 'No'}
                    </p>
                  {:else if modifier?.type === 'font'}
                    {#if item}
                      <div
                        class="text-xl"
                        style={`font-family: "${item?.name}"`}
                      >
                        {item?.name}
                      </div>
                    {:else}
                      <p class="text-xs">N/A</p>
                    {/if}
                  {:else if modifier?.type === 'text'}
                    <p class="text-xs">
                      {m.value || 'N/A'}
                    </p>
                  {:else if modifier?.type === 'upsell'}
                    <div class="flex flex-col space-y-2 w-full">
                      {#each m?.itemIds || [] as id}
                        {@const i = modifier?.items?.find((i) => i.id === id)}
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
                                    src={i?.meta?.image}
                                    class="rounded object-cover w-full aspect-square"
                                  />
                                </div>
                              </div>
                              <div class="flex flex-col">
                                <h3 class="font-bold text-sm">{i?.name}</h3>
                                {#if i?.meta.description}
                                  <p
                                    class="text-sm leading-none pb-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                                  >
                                    {i?.meta?.description}
                                  </p>
                                {/if}
                              </div>
                            </div>
                            <p class="font-bold text-right text-lg">
                              {(i?.cost || 0) < 0 ? '-' : ''}{!i?.percentage
                                ? '$'
                                : ''}{Math.abs(i?.cost || 0)}{i?.percentage
                                ? '%'
                                : ''}
                            </p>
                          </div>
                        </div>
                      {:else}
                        <p class="text-xs">N/A</p>
                      {/each}
                    </div>
                  {:else if modifier?.type === 'image'}
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
            </div> -->
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
