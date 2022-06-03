<script lang="ts">
  import { page } from '$app/stores'

  import { squareratio } from '$lib/actions/aspectratio'

  import Image from '$lib/components/caravaggio/Image.svelte'

  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'

  import { tooltip } from '$lib/components/tooltip'
  import type { ProductModifier } from '$lib/db'
  import { uploadFile } from '$lib/supabase'
  import {
    ChevronRight16,
    Close24,
    Image32,
    Information16,
    TrashCan16,
  } from 'carbon-icons-svelte'
  import { expoOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'
  import ProductModifiersEditor from '../ProductModifiersEditor.svelte'

  let open: Record<string, boolean> = {}

  export let modifier: Omit<ProductModifier, 'items'> & {
    internalId?: string
    items?: (Unarray<ProductModifier['items']> & { internalId?: string })[]
  }

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'scale',
    },
  }

  type Unarray<T> = T extends Array<infer U> ? U : T

  let mounted
  $: if (modifier && !mounted) {
    modifier.items = modifier.items.map((i) => ({
      ...i,
      internalId: (Math.random() + 1).toString(36).substring(7),
    }))
    mounted = true
  }

  $: deleteItem = (
    i: Pick<Unarray<typeof modifier['items']>, 'id' | 'internalId'>
  ) => {
    const idx = modifier.items.findIndex((ii) =>
      i.id ? ii.id == i.id : ii.internalId == i.internalId
    )
    modifier.items[idx].active = false
    if (modifier.items[idx]) {
      modifier.items.splice(idx, 1)
      modifier.items = [...modifier.items]
    }
  }

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new window.Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  const urlBuilder = useCaravaggioBuilder()

  $: uploadImage = async (event, i) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      const file = event.currentTarget.files[0]
      const { url, path } = await uploadFile({
        file,
        bucket: 'assets',
        path: `${$page.stuff.store.slug}/upselling`,
      })

      const optimizedUrl = urlBuilder(url, options)

      const _ = await loadImage(optimizedUrl)

      i.meta.url = url
    } catch (error) {
      alert(error.message)
    } finally {
    }
  }
</script>

<div
  class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
>
  {#each modifier.items.filter((i) => i.active) as i, idx (i.internalId)}
    <div
      class="flex flex-col space-y-4 w-full p-4"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="flex w-full justify-between items-center">
        <div class="flex space-x-4 items-center">
          <button
            class="rounded flex p-1 duration-200"
            title="Show/hide items"
            use:tooltip
            type="button"
            on:click={() => (open[i.internalId] = !open[i.internalId])}
            ><ChevronRight16
              class="transform duration-200 transition-transform {open[
                i.internalId
              ]
                ? 'rotate-90'
                : ''}"
            /></button
          >
          <h3 class="font-bold text-xs block">
            {i.name || `Upsell product #${idx + 1}`}
          </h3>
        </div>
        <div class="flex space-x-1">
          <button
            class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
            title="Delete item"
            type="button"
            on:click={() => deleteItem(i)}
            use:tooltip
          >
            <TrashCan16 class="font-bold" />
          </button>
        </div>
      </div>
      {#if open[i.internalId]}
        <div
          class="grid gap-4 grid-cols-1 lg:grid-cols-3"
          transition:slide|local={{ duration: 400, easing: expoOut }}
        >
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Upsell product name
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              required
              bind:value={i.name}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Description
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              bind:value={i.meta.description}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Price
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              min={0.01}
              step="any"
              bind:value={i.cost}
            />
          </div>
          <div class="relative">
            <button
              type="button"
              class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
              title="Delete image"
              on:click={() => (i.meta.image = '')}
              use:tooltip
            >
              <Close24 />
            </button>
            <div
              class="border-dashed rounded-lg flex border-2 p-2 overflow-hidden relative dark:border-gray-700"
            >
              {#if i.meta.url}
                <Image
                  {options}
                  src={i.meta.url}
                  class="rounded object-cover w-full aspect-square"
                />
              {:else}
                <div
                  class="flex flex-col text-center w-full text-gray-400 items-center justify-center aspect-square"
                  use:squareratio
                >
                  <Image32 class="mb-1" />
                  <span class="font-normal block">Upload an image</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="bg-gray-50 text-xs w-full text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      in:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="text-center w-full py-4 px-6">
        <div class="flex space-x-2 w-full justify-center items-center">
          <Information16 />
          <p class="font-bold text-xs whitespace-nowrap">No items</p>
        </div>
      </div>
    </div>
  {/each}
</div>
