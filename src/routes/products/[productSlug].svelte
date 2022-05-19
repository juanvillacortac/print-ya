<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { Product, ProductModifier } from '$lib/db'
  import Preview from '$lib/components/Preview.svelte'
  import Markdown from 'svelte-markdown'
  import { Add16, Add24, Favorite32, Subtract16 } from 'carbon-icons-svelte'

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
  import { bag } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import { onMount } from 'svelte'
  import type { ProductModifierItem } from '@prisma/client'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import RgbWheel from '$lib/components/__RGBWheel.svelte'
  import { squareratio } from '$lib/actions/aspectratio'

  let quantity = product.minQuantity || 1

  let modifiers: Record<string, { value?: any; itemId?: string }> =
    product.modifiers.reduce((a, v) => ({ ...a, [v.id]: {} }), {})

  let fields = ''

  onMount(() => {
    const defaultItems = product.modifiers
      .filter((m) => m.type === 'color' || m.type === 'select')
      .map((m) => [m.id, m.items[0]] as [string, ProductModifierItem])
    for (let [m, i] of defaultItems) {
      modifiers[m] = {
        itemId: i.id,
        value: i.name,
      }
    }
  })

  $: if (product.type === 'template') {
    const mappedModifiers = Object.entries(modifiers).map(
      ([mId, mValue]) =>
        [product.modifiers.find((m) => m.id === mId), mValue] as [
          ProductModifier,
          { value?: string; itemId?: string }
        ]
    )
    const items = mappedModifiers
      .filter(
        ([m]) =>
          (m.type === 'select' ||
            m.type === 'color' ||
            m.type === 'text' ||
            m.type === 'numeric' ||
            m.type === 'toggle') &&
          m.templateAccessor
      )
      .map(([m, item]) => ({
        value: item.value,
        key: m.templateAccessor,
      }))
    const f = items.reduce((a, b) => ({ ...a, [b.key]: b.value }), {})
    if (Object.keys(f).length) {
      fields = JSON.stringify(f).replace(/[^\p{L}\p{N}\p{P}\p{Z}{\^\$}]/gu, '')
    } else {
      fields = ''
    }
  }

  $: template = { ...(product.template as any), fields }

  let bgColor = ''

  $: total =
    (Object.entries(modifiers)
      .filter(([_, mValue]) => mValue?.itemId)
      .map(([mId, mValue]) => {
        const modifier = product.modifiers.find((m) => m.id === mId)
        const item = modifier.items.find((i) => i.id === mValue.itemId)
        const value = item.percentage
          ? (item.cost / 100) * product.price
          : item.cost
        return value
      })
      .reduce((a, b) => a + b, 0) +
      product.price) *
    quantity

  const addToBag = () => {
    const elementIdx = $bag.findIndex(
      (p) =>
        p.productSlug == product.slug &&
        JSON.stringify(modifiers) === JSON.stringify(p.modifiers)
    )
    if (elementIdx >= 0) {
      $bag[elementIdx].quantity += quantity
      return
    }
    $bag = [
      ...$bag,
      {
        productSlug: product.slug,
        modifiers: {},
        quantity,
      },
    ]
  }
</script>

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
      <div class="flex h-full relative items-start">
        <div
          class="border rounded-lg h-auto border-gray-300 w-full top-0 col-span-1 sticky overflow-hidden relative select-none  dark:border-gray-800"
          style="aspect-ratio: 1/1"
          use:squareratio
        >
          <div class="flex space-x-2 top-2 right-2 z-20 absolute">
            <div class="transform z-20 duration-200 relative hover:scale-90">
              <input
                type="color"
                class="cursor-pointer opacity-0 z-20 absolute !h-8 !w-8"
                title="Change preview background"
                use:tooltip
                bind:value={bgColor}
              />
              <RgbWheel
                class="border rounded-full flex border-gray-500 h-8 transform w-8 dark:border-gray-700"
              />
            </div>
            <button
              class="border rounded-full flex border-gray-500 h-8 transform transition-transform w-8 duration-200 checkerboard-sm !bg-white dark:border-gray-700 hover:scale-90"
              title="Set transparent background"
              use:tooltip
              on:click={() => (bgColor = '')}
            />
          </div>
          <div
            class="flex h-full w-full items-center justify-center relative pointer-events-none"
            class:checkerboard={!bgColor}
            style:background-color={bgColor}
          >
            <Preview {template} fitParent />
          </div>
        </div>
      </div>
    {/if}
    <div class="flex flex-col space-y-4">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
      </div>
      <div class="flex flex-col space-y-4 lg:items-start">
        <p class="font-bold text-black text-2xl dark:text-white">
          ${product.price.toLocaleString()}
        </p>
        <div class="flex flex-col space-y-4">
          {#each product.modifiers as m}
            <div
              class="flex w-full {m.type
                ? 'space-y-2 flex-col'
                : 'space-x-4 items-center justify-end'} lg:justify-between"
            >
              <div
                class="font-bold font-title text-black text-xs dark:text-white"
              >
                {m.name}
              </div>
              {#if m.type === 'select'}
                <select
                  class="bg-white border rounded border-gray-300 text-xs leading-tight py-2 px-3 w-1/2 appearance-none !pr-8 lg:w-60 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                  bind:value={modifiers[m.id].itemId}
                  on:change={() =>
                    (modifiers[m.id].value = m.items.find(
                      (i) => i.id == modifiers[m.id].itemId
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
              {:else if m.type === 'toggle'}
                <input
                  type="checkbox"
                  bind:checked={modifiers[m.id].value}
                  class="justify-start"
                  on:change={() =>
                    (modifiers[m.id].itemId = modifiers[m.id].itemId)}
                />
              {:else if m.type === 'text'}
                <input
                  type="text"
                  placeholder="Write something..."
                  class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none <sm:w-24ch dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                  bind:value={modifiers[m.id].value}
                  on:input={() =>
                    (modifiers[m.id].itemId = modifiers[m.id].itemId)}
                />
              {:else if m.type === 'color'}
                <div class="w-full grid gap-2 grid-cols-8 lg:w-full">
                  {#each m.items as i}
                    <button
                      class="rounded pb-full border-2 w-full transform duration-200 dark:border-gray-600"
                      title={`${i.cost < 0 ? '-' : ''}${
                        !i.percentage ? '$' : ''
                      }${Math.abs(i.cost)}${i.percentage ? '%' : ''}`}
                      on:click={() => {
                        modifiers[m.id].value = i.name || '#000000'
                        modifiers[m.id].itemId = i.id
                      }}
                      class:scale-120={modifiers[m.id].itemId == i.id}
                      class:!border-blue-800={modifiers[m.id].itemId == i.id}
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
              class="rounded flex font-bold space-x-2 bg-[rgb(113,3,3)] shadow text-white text-xl py-4 px-4 transform duration-200 items-center hover:scale-105"
              on:click={addToBag}
              style="will-change: transform"
            >
              <Add24 class="m-auto" />
              <span>Add to cart</span></button
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
</style>
