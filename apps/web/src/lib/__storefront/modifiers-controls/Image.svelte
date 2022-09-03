<script lang="ts">
  import type { ModifierValue, Product, ProductModifier } from '@shackcart/db'
  import { supabase } from '@shackcart/shared'
  import { tooltip } from '$lib/components/tooltip'
  import { page } from '$app/stores'
  import { Close24, Image32 } from 'carbon-icons-svelte'

  export let value: ModifierValue
  export let product: Product
  export let disabled = true
  export const items = undefined

  let uploadingImage = false
  const onModifierImagePaste = async (m: ProductModifier) => {
    if (typeof navigator == 'undefined') return
    try {
      const fileUrl = await navigator.clipboard.readText()
      value.value = fileUrl
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
    event: T
  ) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      uploadingImage = true
      const file = event.currentTarget.files[0]
      const { url } = await supabase.uploadFile({
        file,
        bucket: 'client-assets',
        path: `${$page.data.layoutData.store!.slug}/products/${
          product.slug
        }/template-assets`,
      })
      value.value = url
    } catch (error) {
      alert(error.message)
    } finally {
      uploadingImage = false
    }
  }
</script>

{#if disabled}
  {#if value.value}
    <img src={value.value} alt="" class="object-contain w-3/10" />
  {:else}
    <p class="text-xs">N/A</p>
  {/if}
{:else}
  <div
    class="border-dotted border-dashed rounded-lg flex bg-gray-100 border-gray-300 border-2 p-8 relative justify-center items-center  dark:bg-gray-700 dark:border-gray-600"
    class:cursor-pointer={!uploadingImage}
    class:cursor-not-allowed={uploadingImage}
  >
    {#if !uploadingImage && value.value}
      <button
        class="top-2 right-2 text-gray-400 z-30 absolute"
        title="Delete image"
        use:tooltip
        on:click|preventDefault|stopPropagation={() => (value = {})}
      >
        <Close24 />
      </button>
    {/if}
    <div
      class="flex flex-col text-center text-gray-400 items-center justify-center"
    >
      {#if value.value && !uploadingImage}
        <img
          src={value.value}
          alt=""
          class="object-contain h-32px mb-1 w-32px"
        />
      {:else}
        <Image32 class="mb-1" />
      {/if}
      <span class="font-normal block"
        >{uploadingImage
          ? 'Uploading image...'
          : 'Upload an image (png and svg only)'}</span
      >
    </div>

    <input
      type="file"
      name=""
      class="flex h-full w-full opacity-0 absolute"
      class:!cursor-pointer={!uploadingImage}
      class:!cursor-not-allowed={uploadingImage}
      accept="image/png, image/svg+xml"
      disabled={uploadingImage}
      on:change={(e) => onModifierImageSelected(e)}
    />
  </div>
{/if}
