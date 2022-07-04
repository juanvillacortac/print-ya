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
  import { writable } from 'svelte/store'
  import { slide } from 'svelte/transition'

  let open: Record<string, boolean> = {}

  export let modifier: Omit<ProductModifier, 'items'> & {
    internalId?: string
    items: (Unarray<ProductModifier['items']> & { internalId?: string })[]
  }

  export let disabled = false

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'embed',
      b: '000000.0',
    },
  }

  type Unarray<T> = T extends Array<infer U> ? U : T

  const items = writable(
    modifier.items!.map((i) => ({
      ...i,
      internalId: (Math.random() + 1).toString(36).substring(7),
    }))
  )

  $: if ($items) {
    if (modifier.items!.length > $items.length) {
      $items.push({
        ...modifier.items![modifier.items!.length - 1],
        internalId: (Math.random() + 1).toString(36).substring(7),
      })
      $items = $items
    }
    modifier.items = $items
  }

  const deleteItem = (
    i: Pick<Unarray<typeof modifier['items']>, 'id' | 'internalId'>
  ) => {
    const idx = modifier.items!.findIndex((ii) =>
      i.id ? ii.id == i.id : ii.internalId == i.internalId
    )
    $items[idx].active = false
    if (!$items[idx].id) {
      const newList = $items
      newList.splice(idx, 1)
      items.set(newList)
    }
  }

  let hovering: number | null | undefined

  $: drop = (event, target) => {
    if (disabled) return
    event.dataTransfer.dropEffect = 'move'
    const start = parseInt(event.dataTransfer.getData('text/plain'))
    const newTracklist = $items

    if (start < target) {
      newTracklist.splice(target + 1, 0, newTracklist[start])
      newTracklist.splice(start, 1)
    } else {
      newTracklist.splice(target, 0, newTracklist[start])
      newTracklist.splice(start + 1, 1)
    }
    items.set(newTracklist)
    hovering = null
  }

  const dragstart = (event, i) => {
    if (disabled) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    const start = i
    event.dataTransfer.setData('text/plain', start)
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

  let uploading = {}

  $: uploadImage = async (event, i) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      uploading[i.internalId] = true
      const file = event.currentTarget.files[0]
      const { url, path } = await uploadFile({
        file,
        bucket: 'assets',
        path: `${$page.stuff.store!.slug}/upselling`,
      })

      const optimizedUrl = urlBuilder(url!, options)

      const _ = await loadImage(optimizedUrl)

      i.meta.image = url
    } catch (error) {
      alert(error.message)
    } finally {
      uploading[i.internalId] = false
    }
  }
</script>

<div
  class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
>
  {#each $items.filter((i) => i.active) as i, idx (i.internalId)}
    <div
      class="flex flex-col space-y-4 w-full p-4"
      transition:slide|local={{ duration: 400, easing: expoOut }}
      draggable={!disabled}
      on:dragstart|stopPropagation={(event) => dragstart(event, idx)}
      on:drop|preventDefault|stopPropagation={(event) => drop(event, idx)}
      on:dragover|preventDefault={() => {}}
      on:dragenter|stopPropagation={() => (disabled ? null : (hovering = idx))}
      on:dragend={() => (disabled ? null : (hovering = null))}
      class:bg-blue-100={hovering == idx}
      class:dark:bg-gray-900={hovering == idx}
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
        {#if !disabled}
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
        {/if}
      </div>
      {#if open[i.internalId]}
        <div
          class="grid gap-4 grid-cols-1 items-center lg:grid-cols-4"
          transition:slide|local={{ duration: 400, easing: expoOut }}
        >
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Upsell product name *
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              required
              bind:value={i.name}
              {disabled}
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
              {disabled}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Price
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              step="any"
              bind:value={i.cost}
              {disabled}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Cost type
            </label>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={i.percentage}
              {disabled}
            >
              <option value={false}>Fixed</option>
              <option value={true}>Percentage</option>
            </select>
          </div>
          <div class="relative">
            {#if i.meta?.image && !disabled}
              <button
                type="button"
                class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
                title="Delete image"
                on:click={() => (i.meta.image = '')}
                use:tooltip
              >
                <Close24 />
              </button>
            {:else if !uploading[i.internalId] && !disabled}
              <input
                type="file"
                name=""
                class="cursor-pointer flex h-full w-full opacity-0 absolute"
                accept="image/*"
                on:change={(e) => uploadImage(e, i)}
              />
            {/if}
            <div
              class="border-dashed rounded-lg flex border-2 p-2 overflow-hidden relative pointer-events-none darkborder-gray-700 dark:border-gray-700"
            >
              {#if i.meta?.image}
                <Image
                  {options}
                  src={i.meta?.image}
                  class="rounded object-cover w-full aspect-square"
                />
              {:else}
                <div
                  class="flex flex-col text-center w-full text-gray-400 items-center justify-center aspect-square"
                  use:squareratio
                >
                  <Image32 class="mb-1" />
                  <span class="font-normal block"
                    >{disabled
                      ? 'Without image'
                      : uploading[i.internalId]
                      ? 'Uploading image...'
                      : 'Upload an image'}</span
                  >
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
