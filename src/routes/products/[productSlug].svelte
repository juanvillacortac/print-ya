<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { Product, ProductModifier } from '$lib/db'
  import Preview from '$lib/components/Preview.svelte'
  import Markdown from 'svelte-markdown'
  import {
    Add16,
    Add24,
    Close24,
    CloseOutline24,
    Favorite32,
    Image32,
    ShoppingBag24,
    Subtract16,
  } from 'carbon-icons-svelte'

  export const load: Load = async ({ params, fetch, stuff }) => {
    const store = stuff.store
    const data = await get(
      `/api/stores/${store?.slug}/products/${params.productSlug}`,
      { fetch }
    )
    if (!data)
      return {
        status: 404,
      }
    return {
      props: {
        product: data,
      },
    }
  }
</script>

<script lang="ts">
  export let product: Product
  import { bag, pageSubtitle } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import { onMount } from 'svelte'
  import type { ProductModifierItem } from '@prisma/client'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { squareratio } from '$lib/actions/aspectratio'
  import { uploadFile } from '$lib/supabase'
  import { page } from '$app/stores'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import {
    compareModifiers,
    createModifiersMapStore,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import { isEqual } from 'lodash-es'
  import { browser } from '$app/env'
  let quantity = product.minQuantity || 1

  $pageSubtitle = product?.name

  let modifiers = createModifiersMapStore(product)

  let fields = ''

  onMount(() => {
    let defaultItems = product.modifiers
      .filter((m) => m.type === 'color' || m.type === 'select')
      .map((m) => [m.id, m.items[0]] as [string, ProductModifierItem])
    for (let [m, i] of defaultItems) {
      $modifiers[m] = {
        itemId: i.id,
        value: i.name,
      }
    }
  })

  $: if (product.type === 'template') {
    fields = getTemplateFieldsFromModifiers(product, $modifiers)
  }

  $: fontsItems = product.modifiers
    .filter((m) => m.type === 'font')
    .map((m) => m.items)
    .reduce((a, b) => [...a, ...b], [])
    .map((i) => ({
      name: i?.name,
      url: i?.meta.web
        ? i.meta.url
        : `/api/fontface?name=${encodeURIComponent(
            i.name
          )}&src=${encodeURIComponent(i.meta.url)}`,
    }))

  $: template = { ...(product.template as any), fields }

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'embed',
      b: '000000.0',
    },
  }

  $: total = getTotalFromProductModifiers(product, $modifiers) * quantity

  let upsellingValues = Object.fromEntries(
    product.modifiers.filter((m) => m.type === 'upsell').map((m) => [m.id, []])
  )

  $: if (browser) {
    let u = { ...upsellingValues }
    for (let mId in u) {
      $modifiers[mId] = { ...$modifiers[mId], itemIds: u[mId] }
    }
  }

  // $: if ($modifiers && browser) alert(inBag)

  let uploadingImage: Record<string, boolean> = {}
  const onModifierImagePaste = async (m: ProductModifier) => {
    try {
      const fileUrl = await navigator.clipboard.readText()
      $modifiers[m.id] = { ...$modifiers[m.id], value: fileUrl }
    } catch (error) {
      alert(error.message)
    } finally {
      // uploadingImage[m.id] = false
    }
  }
  const onModifierImageSelected = async <
    T extends Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
  >(
    event: T,
    m: ProductModifier
  ) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      uploadingImage[m.id] = true
      const file = event.currentTarget.files[0]
      const { url } = await uploadFile({
        file,
        bucket: 'client-assets',
        path: `${$page.stuff.store.slug}/products/${product.slug}/template-assets`,
      })
      $modifiers[m.id] = { ...$modifiers[m.id], value: url }
    } catch (error) {
      alert(error.message)
    } finally {
      uploadingImage[m.id] = false
    }
  }
</script>

<svelte:head>
  {#each fontsItems as f}
    <link href={f.url} rel="stylesheet" />
  {/each}
</svelte:head>

<div class="flex flex-col mx-auto space-y-2 w-full py-4 px-4 lg:max-w-9/10">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href=".?category={product.storeCategory.slug}" class="hover:underline"
      >{product.storeCategory.name}</a
    >
  </div>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col" />
  <div class="grid gap-4 grid-cols-1 items-start lg:grid-cols-2">
    {#if product.template && product.type === 'template'}
      <TemplatePreview watermark {template} mockups={product.meta?.mockups} />
    {/if}
    <div class="flex flex-col space-y-4 w-full">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
      </div>
      <div class="flex flex-col space-y-4 w-full lg:items-start">
        <p class="font-bold text-black text-2xl dark:text-white">
          ${product.price.toLocaleString()}
        </p>
        <div class="flex flex-col space-y-4 w-full">
          {#each product.modifiers as m}
            {@const item = $modifiers[m.id]
              ? m.items.find((i) => i.id === $modifiers[m.id]?.itemId)
              : undefined}
            {@const itemName =
              m.type === 'font'
                ? item?.name
                : m.type === 'color'
                ? item?.meta?.name
                : ''}
            <div
              class="flex w-full {m.type
                ? 'space-y-2 flex-col'
                : 'space-x-4 items-center justify-end'} lg:justify-between"
            >
              <div
                class="font-bold font-title text-black text-xs dark:text-white"
              >
                {m.name}{#if itemName}: <span class="font-normal"
                    >{itemName}</span
                  >{/if}
              </div>
              {#if m.type === 'select'}
                <select
                  class="bg-white border rounded border-gray-300 text-xs leading-tight py-2 px-3 w-1/2 appearance-none !pr-8 lg:w-60 lg:w-6/10 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                  bind:value={$modifiers[m.id].itemId}
                  on:change={() =>
                    ($modifiers[m.id].value = m.items.find(
                      (i) => i.id == $modifiers[m.id].itemId
                    )?.name)}
                >
                  {#each m.items as i}
                    <option value={i.id}
                      >{i.name}&nbsp;&nbsp;&ndash;&nbsp;&nbsp;<strong
                        >{i.cost < 0 ? '-' : ''}{!i.percentage
                          ? '$'
                          : ''}{Math.abs(i.cost)}{i.percentage
                          ? '%'
                          : ''}</strong
                      ></option
                    >
                  {/each}
                </select>
              {:else if m.type === 'upsell'}
                <div class="w-full grid gap-4 grid-cols-2 lg:w-6/10">
                  {#each m.items as i}
                    <div
                      class="border rounded-lg shadow w-full transform transition-transform duration-200 relative dark:border-gray-700 hover:scale-102"
                      style="will-change: transform"
                      class:!scale-102={upsellingValues[m.id]?.includes(i.id)}
                      class:!border-blue-500={upsellingValues[m.id]?.includes(
                        i.id
                      )}
                    >
                      <input
                        type="checkbox"
                        class="cursor-pointer h-full w-full opacity-0 z-20 absolute"
                        bind:group={upsellingValues[m.id]}
                        on:change={() => (upsellingValues = upsellingValues)}
                        value={i.id}
                      />
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
                                {options}
                                src={i.meta?.image}
                                class="rounded object-cover w-full aspect-square"
                              />
                            </div>
                          </div>
                          <div class="flex flex-col">
                            <h3 class="font-bold text-sm">{i.name}</h3>
                            {#if i.meta.description}
                              <p
                                class="text-sm leading-none overflow-hidden overflow-ellipsis whitespace-nowrap"
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
                  {/each}
                </div>
              {:else if m.type === 'font'}
                <div
                  class="w-full grid gap-4 grid-cols-3 lg:w-full lg:w-6/10 lg:grid-cols-4"
                >
                  <button
                    class="border-dashed rounded flex border-2 text-lg w-full p-2 transform transition-transform text-gray-200 duration-200 items-center justify-center dark:border-gray-600 dark:text-gray-600"
                    title="Unset font"
                    on:click={() =>
                      ($modifiers[m.id] = { itemId: '', value: '' })}
                    use:tooltip
                    style="will-change: transform;"><CloseOutline24 /></button
                  >
                  {#each m.items as i}
                    <button
                      class="rounded border-2 text-lg w-full p-1 transform transition-transform duration-200 dark:border-gray-600"
                      title={i.name}
                      on:click={() =>
                        ($modifiers[m.id] = {
                          itemId: i.id,
                          value: {
                            name: i?.name,
                            url: i?.meta.web
                              ? i.meta.url
                              : `/api/fontface?name=${encodeURIComponent(
                                  i.name
                                )}&src=${encodeURIComponent(i.meta.url)}`,
                          },
                        })}
                      class:scale-120={$modifiers[m.id].itemId == i.id}
                      class:!border-blue-800={$modifiers[m.id].itemId == i.id}
                      use:tooltip
                      style={`will-change: transform; font-family: "${i.name}";`}
                      >Hello</button
                    >
                  {/each}
                </div>
              {:else if m.type === 'toggle'}
                <input
                  type="checkbox"
                  bind:checked={$modifiers[m.id].value}
                  class="justify-start"
                  on:change={() =>
                    ($modifiers[m.id].itemId = $modifiers[m.id].itemId)}
                />
              {:else if m.type === 'image'}
                <div
                  class="border-dotted border-dashed rounded-lg flex bg-gray-100 border-gray-300 border-2 p-8 relative justify-center items-center lg:w-6/10 dark:bg-gray-700 dark:border-gray-600"
                  class:cursor-pointer={!uploadingImage[m.id]}
                  class:cursor-not-allowed={uploadingImage[m.id]}
                  on:click={() => onModifierImagePaste(m)}
                >
                  {#if !uploadingImage[m.id] && $modifiers[m.id].value}
                    <button
                      class="top-2 right-2 text-gray-400 absolute"
                      title="Delete image"
                      use:tooltip
                      on:click|preventDefault|stopPropagation={() =>
                        ($modifiers[m.id].value = '')}
                    >
                      <Close24 />
                    </button>
                  {/if}
                  <div
                    class="flex flex-col text-center text-gray-400 items-center justify-center"
                  >
                    {#if $modifiers[m.id]?.value && !uploadingImage[m.id]}
                      <img
                        src={$modifiers[m.id]?.value}
                        alt=""
                        class="object-contain h-32px mb-1 w-32px"
                      />
                    {:else}
                      <Image32 class="mb-1" />
                    {/if}
                    <span class="font-normal block"
                      >{uploadingImage[m.id]
                        ? 'Uploading image...'
                        : 'Click/tap to paste image URL'}</span
                    >
                  </div>

                  <!-- <input
                    type="file"
                    name=""
                    class="flex h-full w-full opacity-0"
                    class:!cursor-pointer={!uploadingImage[m.id]}
                    class:!cursor-not-allowed={uploadingImage[m.id]}
                    accept="image/*"
                    disabled={uploadingImage[m.id]}
                    on:change={(e) => onModifierImageSelected(e, m)}
                  /> -->
                </div>
              {:else if m.type === 'text'}
                <input
                  type="text"
                  placeholder="Write something..."
                  class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-6/10 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
                  bind:value={$modifiers[m.id].value}
                  on:input={() =>
                    ($modifiers[m.id].itemId = $modifiers[m.id].itemId)}
                />
              {:else if m.type === 'color'}
                <div class="w-full grid gap-2 grid-cols-8 lg:w-6/10">
                  {#each m.items as i}
                    <button
                      class="rounded pb-full border-2 w-full transform duration-200 dark:border-gray-600"
                      title={i?.meta?.name}
                      class:scale-120={$modifiers[m.id].itemId == i.id}
                      class:!border-blue-800={$modifiers[m.id].itemId == i.id}
                      on:click={() =>
                        ($modifiers[m.id] = {
                          itemId: i.id,
                          value: i.name,
                        })}
                      use:tooltip
                      use:squareratio
                      style="will-change: transform; aspect-ratio: 1/1; background-color: {i.name ||
                        'black'}"
                    />
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="flex space-x-2 items-center">
          <div class="font-bold font-title text-black text-xs dark:text-white">
            Quantity{product.minQuantity
              ? ` (min ${product.minQuantity} per order)`
              : ''}
          </div>
          <div class="flex !text-xs">
            <button
              class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
              on:click={() =>
                (quantity = Math.max(product.minQuantity || 1, quantity - 1))}
            >
              <Subtract16 class="m-auto" />
            </button>
            <input
              class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-6ch quantity dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
              type="number"
              min={Math.max(product.minQuantity || 1)}
              bind:value={quantity}
            />
            <button
              class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-gray-700  dark:border-gray-600"
              on:click={() => quantity++}
            >
              <Add16 class="m-auto" />
            </button>
          </div>
        </div>
        <div class="flex space-x-4 items-center justify-between !w-full">
          <div class="flex space-x-4 items-center">
            <button
              class="rounded flex font-bold space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xl py-4 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105"
              on:click={() => bag.addToBag(product, $modifiers, quantity)}
              style="will-change: transform"
            >
              <Add24 class="m-auto" />
              <span>Add to bag</span></button
            >
            <button
              class="flex text-gray-400 relative hover:text-pink-500"
              title="Add to favorites"
              use:tooltip
              style="width: 32px; height: 32px"
            >
              <Favorite32 />
            </button>
          </div>
          <div class="font-bold text-lg text-black dark:text-white">
            Total ${total.toLocaleString()}
          </div>
        </div>
        <Image
          src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/checkout_icon.png?v=172537687083778273411570901059"
          class="ml-auto w-full sm:w-3/4"
          options={{
            q: 100,
          }}
        />
        <div class="border-t pt-4 pb-2 prose-sm !w-full dark:border-gray-600">
          <Markdown source={product.description || 'No description'} />
        </div>
        <div
          class="border-t flex flex-col space-y-4 pt-4 items-center !w-full dark:border-gray-600"
        >
          <p class="text-center">4 Great reasons to buy from us:</p>
          <div
            class="text-sm text-center w-full grid gap-4 grid-cols-4 self-start lg:w-3/4"
          >
            <div class="flex flex-col space-y-2">
              <Image
                src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/topreasons_1_image_150x.png?v=96138826798940876551601679670"
                class="w-full"
                options={{
                  q: 100,
                }}
              />
              <p>Free shipping with Canada Post (when you spend over $35)</p>
            </div>
            <div class="flex flex-col space-y-2">
              <Image
                src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/topreasons_2_image_150x.png?v=56700843281458722951601679057"
                class="w-full"
                options={{
                  q: 100,
                }}
              />
              <p>Made in Canada</p>
            </div>
            <div class="flex flex-col space-y-2">
              <Image
                src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/topreasons_4_image_150x.png?v=136892144237653317881601679058"
                class="w-full"
                options={{
                  q: 100,
                }}
              />
              <p>Canadian Company</p>
            </div>
            <div class="flex flex-col space-y-2">
              <Image
                src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/topreasons_5_image_150x.png?v=75465245928373080681601679672"
                class="w-full"
                options={{
                  q: 100,
                }}
              />
              <p>Secure Ordering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .preview-button {
    @apply bg-white border rounded flex border-gray-400 shadow p-1 transform transition-transform duration-200;
  }

  .preview-button:hover {
    @apply -translate-y-px;
  }

  :global(.dark) .preview-button {
    @apply border-transparent border bg-gray-700  border-gray-600;
  }

  :global(.dark) .preview-button:hover {
    @apply border-gray-300;
  }

  .checkerboard,
  .checkerboard-sm {
    --black-cell: rgba(55, 65, 81, 0.2);
    background-image: linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      ),
      linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      );
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
  }
  :global(.dark) .checkerboard,
  :global(.dark) .checkerboard-sm {
    --black-cell: rgba(55, 65, 81, 0.5);
    background-color: rgba(80, 80, 80, 0.2);
  }
  .checkerboard-sm {
    background-size: 10px 10px;
    background-position: 0 0, 5px 5px;
  }
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
  }

  .outlined {
    position: relative;
  }
  .outlined:hover:after {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    outline: 2px dashed rgba(10, 10, 10, 0.4);
    outline-offset: -2px;
  }
  :global(.dark) .outlined:hover:after {
    outline: 2px dashed rgba(255, 255, 255, 0.5);
  }
</style>
