<script lang="ts">
  import 'bytemd/dist/index.css'
  import {
    AddAlt16,
    ChevronRight16,
    Close24,
    Information16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Product } from '$lib/db'
  import { fade, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { removeFiles, uploadFile } from '$lib/supabase'
  import { page } from '$app/stores'
  import { writable } from 'svelte/store'
  import { scale, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import Img from '$lib/components/caravaggio/Image.svelte'
  import {
    useCaravaggio,
    useCaravaggioBuilder,
  } from '$lib/components/caravaggio/useCaravaggio'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { squareratio } from '$lib/actions/aspectratio'

  export let product: Partial<Product>

  const images = writable<Record<'path' | 'url', string>[]>(
    product.meta?.mockups || []
  )

  let expanded = false

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'scale',
    },
  }

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  let uploading = false

  let uploadImage: <
    T extends Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
  >(
    event: T
  ) => Promise<void>

  const urlBuilder = useCaravaggioBuilder()

  $: uploadImage = async (event) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      const file = event.currentTarget.files[0]
      uploading = true
      const { url, path } = await uploadFile({
        file,
        bucket: 'assets',
        path: `${$page.stuff.store.slug}/products/${product.slug}/mockups`,
      })

      const optimizedUrl = urlBuilder(url, options)

      const _ = await loadImage(optimizedUrl)

      images.update((img) => [...img, { path, url }])
      expanded = true
    } catch (error) {
      alert(error.message)
    } finally {
      uploading = false
    }
  }

  const deleteImage = (path: string) => {
    $images.splice(
      $images.findIndex((i) => i.path === path),
      1
    )
    $images = $images
  }

  $: {
    if (!product.meta?.mockups) {
      product.meta = {
        mockups: [],
      }
    }
    product.meta.mockups = $images
  }

  let hovering: number

  $: drop = (event, target) => {
    event.dataTransfer.dropEffect = 'move'
    const start = parseInt(event.dataTransfer.getData('text/plain'))
    const newTracklist = $images

    if (start < target) {
      newTracklist.splice(target + 1, 0, newTracklist[start])
      newTracklist.splice(start, 1)
    } else {
      newTracklist.splice(target, 0, newTracklist[start])
      newTracklist.splice(start + 1, 1)
    }
    images.set(newTracklist)
    hovering = null
  }

  const dragstart = (event, i) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    const start = i
    event.dataTransfer.setData('text/plain', start)
  }
</script>

<div
  class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-700 "
>
  <div class="flex w-full justify-between items-center relative">
    <input
      type="file"
      name=""
      class="h-0 opacity-0 top-0 w-0 absolute"
      accept="image/*"
      id="mockup-upload"
      on:change={(e) => uploadImage(e)}
    />
    <div class="flex space-x-4 items-center relative">
      <button
        class="rounded flex p-1 duration-200"
        title="Show/hide items"
        use:tooltip
        on:click={() => (expanded = !expanded)}
        type="button"
        ><ChevronRight16
          class="transform duration-200 transition-transform {expanded
            ? 'rotate-90'
            : ''}"
        /></button
      >
      <h3 class="font-bold text-xs block">Mockup images</h3>
    </div>
    <div class="flex space-x-1">
      {#if uploading}
        <button
          class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
          title="Uploading image"
          type="button"
          use:tooltip
        >
          <div class="lds-ring">
            <div />
            <div />
            <div />
            <div />
          </div>
        </button>
      {:else}
        <button
          class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
          title="Add image"
          type="button"
          disabled={uploading}
          use:tooltip
          on:click={() => document.getElementById('mockup-upload')?.click()}
        >
          <AddAlt16 class="font-bold" />
        </button>
      {/if}
    </div>
  </div>
  {#if expanded}
    <div
      class="flex w-full"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="w-full grid pt-2 gap-4 grid-cols-2 lg:grid-cols-4">
        {#each $images as { path, url }, idx (path)}
          <div
            class="relative"
            animate:flip={{ duration: 400, easing: expoOut }}
            draggable={true}
            on:dragstart|stopPropagation={(event) => dragstart(event, idx)}
            on:drop|preventDefault|stopPropagation={(event) => drop(event, idx)}
            on:dragover|preventDefault={() => {}}
            on:dragenter|stopPropagation={() => (hovering = idx)}
            on:dragend={() => (hovering = null)}
            in:scale|local={{
              duration: 400,
              easing: expoOut,
              start: 0.2,
              opacity: 0.5,
            }}
          >
            <button
              type="button"
              class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
              title="Delete image"
              on:click={() => deleteImage(path)}
              use:tooltip
            >
              <Close24 />
            </button>
            <div
              class="border-dashed rounded-lg flex border-2 overflow-hidden relative aspect-square dark:border-gray-700"
              use:squareratio
            >
              <div
                class="flex h-full w-full opacity-50 absolute"
                class:bg-blue-100={hovering == idx}
                class:dark:bg-blue-500={hovering == idx}
              />
              <div class="p-2">
                <Img
                  {options}
                  src={url}
                  class="rounded object-cover w-full aspect-square"
                />
              </div>
            </div>
          </div>
        {:else}
          <div
            class="border rounded-lg bg-gray-50 text-xs w-full col-span-full text-gray-500 dark:bg-gray-700 dark:border-gray-700 dark:text-gray-400"
            in:fly|local={{ easing: expoOut }}
          >
            <div class="text-center w-full py-4 px-6">
              <div class="flex space-x-2 w-full justify-center items-center">
                <Information16 />
                <p class="font-bold text-xs whitespace-nowrap">
                  Upload a image
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .lds-ring {
    display: inline-block;
    position: relative;
    width: 16px;
    height: 16px;
  }
  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 16px;
    height: 16px;
    margin: 0px;
    border: 2px solid currentColor;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
