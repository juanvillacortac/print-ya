<script lang="ts">
  import { squareratio } from '$lib/actions/aspectratio'

  import Image from '$lib/components/caravaggio/Image.svelte'

  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'

  import { tooltip } from '$lib/components/tooltip'
  import type { Product, ProductModifier } from '@shackcart/db'
  import { layoutData } from '$lib/stores'
  import { uploadFile } from '$lib/supabase'
  import { ChevronRight16, Close24, Image32 } from 'carbon-icons-svelte'
  import { expoOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'

  export let product: Partial<Product>
  export let disabled = false
  export let modifiers: (Omit<ProductModifier, 'items'> & {
    internalId?: string
    items: (Unarray<ProductModifier['items']> & { internalId?: string })[]
  })[] = []

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

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new window.Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  const urlBuilder = useCaravaggioBuilder()

  let uploading = false

  $: uploadImage = async (event) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      uploading = true
      const file = event.currentTarget.files[0]
      const { url } = await uploadFile({
        file,
        bucket: 'assets',
        path: `${$layoutData.store!.slug}/products/`,
      })

      const optimizedUrl = urlBuilder(url!, options)

      const _ = await loadImage(optimizedUrl)

      product.meta.templateImage = url
    } catch (error) {
      alert(error.message)
    } finally {
      uploading = false
    }
  }
  let showing = false
</script>

<div
  class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
>
  <div class="flex w-full justify-between items-center">
    <div class="flex space-x-4 items-center">
      <button
        class="rounded flex p-1 duration-200"
        title="Show/hide items"
        use:tooltip
        on:click={() => (showing = !showing)}
        type="button"
        ><ChevronRight16
          class="transform duration-200 transition-transform {showing
            ? 'rotate-90'
            : ''}"
        /></button
      >
      <h3 class="font-bold text-xs block">Product custom design</h3>
    </div>
  </div>
  {#if showing}
    <div
      class="w-full grid gap-4 items-start sm:grid-cols-2"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="flex flex-col space-y-2">
        <div class="font-bold text-xs">Design image</div>
        <div class="relative">
          {#if product.meta?.templateImage && !disabled}
            <button
              type="button"
              class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
              title="Delete image"
              on:click={() => (product.meta.templateImage = '')}
              use:tooltip
            >
              <Close24 />
            </button>
          {:else if !uploading && !disabled}
            <input
              type="file"
              name=""
              class="cursor-pointer flex h-full w-full opacity-0 absolute"
              accept="image/*"
              on:change={(e) => uploadImage(e)}
            />
          {/if}
          <div
            class="border-dashed rounded-lg flex border-2 p-2 overflow-hidden relative pointer-events-none darkborder-gray-700 dark:border-gray-700"
          >
            {#if product.meta?.templateImage}
              <Image
                {options}
                src={product.meta?.templateImage}
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
                    : uploading
                    ? 'Uploading image...'
                    : 'Upload an image'}</span
                >
              </div>
            {/if}
          </div>
        </div>
      </div>
      <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Default template text
          </label>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="text"
            bind:value={product.meta.templateText}
            {disabled}
          />
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Image modifier
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.meta.templateImageModifier}
          >
            <option value="">No modifier</option>
            {#each modifiers.filter((m) => m.type === 'image') as { id, name }}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Color modifier
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.meta.templateColorModifier}
          >
            <option value="">No modifier</option>
            {#each modifiers.filter((m) => m.type === 'color') as { id, name }}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Text modifier
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.meta.templateTextModifier}
          >
            <option value="">No modifier</option>
            {#each modifiers.filter((m) => m.type === 'text') as { id, name } (id)}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Font modifier
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.meta.templateFontModifier}
          >
            <option value="">No modifier</option>
            {#each modifiers.filter((m) => m.type === 'font') as { id, name } (id)}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Mirror modifier
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.meta.templateMirrorModifier}
          >
            <option value="">No modifier</option>
            {#each modifiers.filter((m) => m.type === 'toggle') as { id, name } (id)}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  {/if}
</div>
