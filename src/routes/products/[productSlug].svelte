<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import type { Product, Store } from '$lib/db'
  import Preview from '$lib/components/Preview.svelte'
  import Markdown from 'svelte-markdown'
  import { tooltip } from '$lib/components/tooltip'
  import {
    Checkbox16,
    ZoomFit16,
    ZoomIn16,
    ZoomOut16,
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
  let scale = 100
  let border = true
  const zoomIn = () => (scale = Math.max(10, Math.min(scale + 10, 200)))
  const zoomOut = () => (scale = Math.max(10, Math.min(scale - 10, 200)))
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-8/10 lg:px-6"
>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col" />
  <div
    class="grid gap-4 grid-cols-1 items-start"
    class:lg:grid-cols-3={product.template && product.isTemplate}
  >
    {#if product.template && product.isTemplate}
      <div
        class="border rounded-lg h-full border-gray-300 w-auto overflow-hidden pointer-events-none  select-none  dark:border-gray-800"
        style="aspect-ratio: 1/1"
      >
        <div
          class="flex h-full w-full items-center justify-center checkerboard"
        >
          <Preview template={JSON.parse(product?.template || '{}')} fitParent />
        </div>
      </div>
      <!-- <div class="flex h-full w-full relative" style="aspect-ratio: 1/1"> -->
      <!-- <div
          class="border rounded h-full border-gray-300 w-full absolute overflow-auto checkerboard dark:border-gray-800"
        >
          <div
            class="origin-top-left transition-transform duration-200"
            style="transform: scale({scale / 100})"
          >
            <Preview template={JSON.parse(product.template)} {border} />
          </div>
        </div>
        <div
          class="flex space-x-1 right-1rem bottom-1rem absolute items-center"
        >
          <p class="font-bold text-xs pr-4">{scale}%</p>
          <button
            class="preview-button"
            title="Zoom Out"
            type="button"
            use:tooltip
            on:click={zoomOut}
          >
            <ZoomOut16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            title="Reset zoom"
            type="button"
            use:tooltip
            on:click={() => (scale = 100)}
          >
            <ZoomFit16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            title="Zoom In"
            type="button"
            use:tooltip
            on:click={zoomIn}
          >
            <ZoomIn16 class="font-bold" />
          </button>
          <button
            class="preview-button"
            type="button"
            title="Toggle border"
            use:tooltip
            on:click={() => (border = !border)}
          >
            <Checkbox16 class="font-bold" />
          </button>
        </div> -->
      <!-- </div> -->
    {/if}
    <div class="flex flex-col space-y-4 w-full lg:col-span-2">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
        <a
          href=".?category={product.storeCategory.slug}"
          class="text-xs text-blue-500 hover:underline"
          >{product.storeCategory.name}</a
        >
      </div>
      <p class="font-bold text-4xl">
        ${product.price.toLocaleString()} <span class="text-lg">/ unit</span>
      </p>
      <div class="prose-sm !w-full">
        <Markdown source={product.description || 'No description'} />
      </div>
    </div>
  </div>
</div>

<style>
  .checkerboard {
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
  :global(.dark) .checkerboard {
    --black-cell: rgba(55, 65, 81, 0.5);
    background-color: rgba(80, 80, 80, 0.2);
  }
</style>
