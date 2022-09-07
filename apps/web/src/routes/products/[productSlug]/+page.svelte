<script lang="ts">
  import { bag, favorites, pageSubtitle } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import TemplatePreview from '$lib/components/TemplatePreview.svelte'
  import Markdown from 'svelte-markdown'
  import {
    getBasicTemplate,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
  } from '@shackcart/db/dist/utils'
  import { browser } from '$app/environment'
  import trpc from '$lib/trpc/client'
  import {
    Add16,
    Favorite32,
    FavoriteFilled32,
    Subtract16,
  } from 'carbon-icons-svelte'
  import ModifiersControls from '$lib/__storefront/ModifiersControls.svelte'
  import type { PageData } from './$types'
  import type { ModifiersMap } from '@shackcart/db'

  export let data: PageData
  $: product = data.product

  let quantity = data.product.minQuantity || 1

  $pageSubtitle = data.product?.name

  let modifiers: ModifiersMap

  $: template =
    data.product.type === 'template'
      ? getBasicTemplate(data.product, modifiers)
      : {
          ...(data.product.template as any),
          fields: getTemplateFieldsFromModifiers(data.product, modifiers),
        }

  $: total = getTotalFromProductModifiers(data.product, modifiers) * quantity

  let inBag = false
  $: if (browser && $bag && modifiers) {
    inBag = bag.existInBag(data.product, modifiers)
  }
</script>

<div class="flex flex-col mx-auto space-y-2 w-full py-4 px-4 lg:max-w-9/10">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href="/products" class="hover:underline">Products</a>
    <!-- <span>/</span> -->
    <!-- <a
      href="/products?category={product?.storeCategory?.slug}"
      class="hover:underline">{product.storeCategory?.name}</a
    > -->
  </div>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col" />
  <div class="grid gap-4 grid-cols-1 items-start lg:grid-cols-2">
    {#if product.type.startsWith('template')}
      <TemplatePreview watermark mockups={product.meta?.mockups} {template} />
    {/if}
    <div class="flex flex-col space-y-4 w-full">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
      </div>
      <div class="flex flex-col space-y-4 w-full lg:items-start">
        <div class="flex flex-col space-y-2">
          <p class="font-bold text-black text-2xl dark:text-white">
            ${product.price.toLocaleString()}
          </p>
          <div class="font-bold text-lg text-black dark:text-white">
            Total: ${total.toLocaleString()}
          </div>
        </div>
        <div class="flex flex-wrap -m-1">
          {#each product.categories || [] as category}
            <a
              href="/products?category={encodeURI(category.name)}"
              class="rounded bg-gray-200 m-1 text-xs leading-none max-w-14ch p-1 transform duration-200 overflow-hidden whitespace-nowrap overflow-ellipsis dark:bg-gray-600 hover:scale-102 hover:underline"
              >{category.name}</a
            >
          {/each}
        </div>
        <div class="flex w-full lg:w-7/10">
          <ModifiersControls bind:product bind:modifiers />
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
        <div
          class="flex justify-between sm:space-x-4 sm:items-center <sm:flex-col <sm:space-y-4 !w-full"
        >
          <div class="flex space-x-4 w-full items-center">
            <div class="flex space-x-2">
              <button
                class="bg-$sc-color-primary rounded flex font-bold space-x-2 shadow text-white text-sm py-4 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105 active:not-disabled:scale-95"
                on:click={() => bag.addToBag(product, modifiers, quantity)}
                style="will-change: transform"
              >
                <Add16 class="m-auto" />
                <span>{inBag ? 'Add more' : 'Add'} to bag</span></button
              >
              {#if inBag}
                <a
                  class="bg-$sc-color-primary rounded flex font-bold space-x-2 shadow text-white text-sm py-4 px-4 transform duration-200 items-center disabled:cursor-not-allowed hover:not-disabled:scale-105"
                  href="/bag?checkout"
                  style="will-change: transform"
                >
                  Go to checkout</a
                >
              {/if}
            </div>
            {#if $favorites.existInFavorites(product.id)}
              <button
                class="flex text-pink-500 relative hover:text-pink-400"
                title="Remove from favorites"
                on:click|preventDefault|stopPropagation={() =>
                  favorites.delete(product.id)}
                use:tooltip
              >
                <FavoriteFilled32 />
              </button>
            {:else}
              <button
                class="flex text-gray-400 relative hover:text-pink-500"
                title="Add to favorites"
                on:click|preventDefault|stopPropagation={() =>
                  favorites.addToFavorites(product.id)}
                use:tooltip
              >
                <Favorite32 />
              </button>
            {/if}
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
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
  }
</style>
