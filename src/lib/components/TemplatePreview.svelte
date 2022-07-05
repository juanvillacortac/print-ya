<script>
  import Slider from 'svelte-range-slider-pips'
  import { squareratio } from '$lib/actions/aspectratio'
  import {
    Camera24,
    Close24,
    ColorPalette24,
    ImageSearch24,
    Rotate16,
    ZoomIn16,
    ZoomOut16,
  } from 'carbon-icons-svelte'
  import { tooltip } from './tooltip'
  import Preview from './Preview.svelte'
  import {
    useCaravaggio,
    useCaravaggioBuilder,
  } from './caravaggio/useCaravaggio'
  import { page } from '$app/stores'
  import { scale, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import Image from './caravaggio/Image.svelte'
  import { flip } from 'svelte/animate'
  import { clamp } from '$lib/utils/math'

  /** @type {{
   * path: string
   * url: string
   * }[]} */
  export let mockups = []

  /** @type {import('$lib/compiler').TemplateSource | import('@prisma/client').Prisma.JsonValue} */
  export let template
  export let watermark = false

  let previewRotate = [0]
  let previewScale = [100]
  let previewBg = ''
  /** @type {HTMLInputElement} */
  let fileInput

  const onFileSelected = (e) => {
    let image = e.target.files[0]
    let reader = new FileReader()
    reader.onloadend = () => {
      previewBg = `url("${reader.result}")`
    }
    reader.readAsDataURL(image)
  }

  /** @type {import('./caravaggio/urlBuilder').CaravaggioOptions} */
  const options = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'scale',
    },
  }

  const urlBuilder = useCaravaggioBuilder()

  export let controls = true
  export let lazy = false
  let show = false

  let intersectionObserver
  function viewport(element) {
    const ensureIntersectionObserver = () => {
      if (intersectionObserver) return

      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          show = entry.isIntersecting
        })
      })
    }
    if (lazy) {
      ensureIntersectionObserver()
      intersectionObserver?.observe(element)
    } else {
      show = true
    }

    return {
      destroy() {
        intersectionObserver?.unobserve(element)
      },
    }
  }

  let gallery = false
  export let showFonts = false

  $: if (!mockups?.length && gallery) {
    gallery = false
  }
</script>

<div class="flex h-full w-full relative items-start" use:viewport>
  {#if show}
    <div
      class="border rounded-lg h-auto border-gray-300 w-full top-0 col-span-1 sticky overflow-hidden relative select-none  dark:border-gray-700"
      style="aspect-ratio: 1/1"
      use:squareratio
      on:wheel={(e) => {
        if (e.ctrlKey && controls) {
          e.preventDefault()
          if (e.deltaY > 0) {
            previewScale[0] = clamp({
              min: 10,
              max: 200,
              val: previewScale[0] - 10,
            })
          } else {
            previewScale[0] = clamp({
              min: 10,
              max: 200,
              val: previewScale[0] + 10,
            })
          }
        }
      }}
    >
      {#if gallery && controls}
        <div
          class="bg-white flex flex-col h-full space-y-2 w-full p-2 z-30 absolute dark:bg-gray-800"
          transition:slide|local={{ easing: expoOut }}
        >
          <div class="flex w-full justify-end items-start">
            <button
              title="Close gallery"
              type="button"
              on:click={() => (gallery = false)}
              use:tooltip><Close24 /></button
            >
          </div>
          <div class="flex-grow h-full w-full overflow-auto">
            <div class="w-full grid px-10px gap-4 grid-cols-2">
              {#each mockups as { url, path }, idx (path)}
                <div
                  class="flex w-full"
                  animate:flip={{ duration: 400, easing: expoOut }}
                  out:scale={{
                    easing: expoOut,
                    start: 0.2,
                  }}
                  in:scale={{
                    easing: expoOut,
                    start: 0.2,
                    delay: idx * 100 + 200,
                  }}
                >
                  <button
                    class="border-dashed rounded-lg flex border-2 w-full p-2 transform transition-transform duration-200 overflow-hidden relative dark:border-gray-700 hover:scale-95"
                    title="Set as background"
                    use:tooltip
                    type="button"
                    on:click={() => {
                      previewBg = `url('${urlBuilder(url, options)}')`
                      gallery = false
                    }}
                    use:squareratio
                  >
                    <Image
                      {options}
                      src={url}
                      class="rounded object-cover w-full aspect-square"
                    />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
      {#if controls}
        <div
          class="flex flex-col h-full w-full top-0 z-20 absolute pointer-events-none items-center justify-end"
        >
          <div
            class="flex opacity-50 transition-opacity duration-200 pointer-events-auto items-center <sm:space-x-4 <sm:p-2 hover:opacity-100"
          >
            <div
              class="rounded-lg cursor-pointer flex bg-red-500 p-6px transform duration-200 hover:scale-95"
              on:click={() =>
                (previewRotate[0] = clamp({
                  min: -180,
                  max: 180,
                  val: previewRotate[0] - 10,
                }))}
            >
              <Rotate16 class="text-white" />
            </div>
            <div class="w-200px <sm:hidden">
              <Slider
                bind:values={previewRotate}
                min={-180}
                max={180}
                step={10}
                --range-slider="rgb(252, 165, 165)"
                --range-handle="rgb(239, 68, 68)"
                --range-handle-inactive="rgb(239, 68, 68)"
                --range-handle-focus="rgb(239, 68, 68)"
              />
            </div>
            <div
              class="rounded-lg cursor-pointer flex bg-red-500 p-6px transform duration-200 hover:scale-95"
              on:click={() =>
                (previewRotate[0] = clamp({
                  min: -180,
                  max: 180,
                  val: previewRotate[0] + 10,
                }))}
            >
              <Rotate16 class="text-white" style="transform: scale(-1, 1);" />
            </div>
          </div>
        </div>
        <div
          class="flex h-full w-full top-0 z-20 absolute pointer-events-none items-center justify-end"
        >
          <div
            class="flex flex-col opacity-50 transition-opacity duration-200 pointer-events-auto items-center <sm:space-y-4 <sm:p-2 hover:opacity-100"
          >
            <div
              class="rounded-lg cursor-pointer flex bg-red-500 p-6px transform duration-200 hover:scale-95"
              on:click={() =>
                (previewScale[0] = clamp({
                  min: 10,
                  max: 200,
                  val: previewScale[0] + 10,
                }))}
            >
              <ZoomIn16 class="text-white" />
            </div>
            <div class="content <sm:hidden">
              <Slider
                bind:values={previewScale}
                min={10}
                max={200}
                step={10}
                vertical
                --range-slider="rgb(252, 165, 165)"
                --range-handle="rgb(239, 68, 68)"
                --range-handle-inactive="rgb(239, 68, 68)"
                --range-handle-focus="rgb(239, 68, 68)"
              />
            </div>
            <div
              class="rounded-lg cursor-pointer flex bg-red-500 p-6px transform duration-200 hover:scale-95"
              on:click={() =>
                (previewScale[0] = clamp({
                  min: 10,
                  max: 200,
                  val: previewScale[0] - 10,
                }))}
            >
              <ZoomOut16 class="text-white" />
            </div>
          </div>
        </div>
        <div
          class="bg-white border rounded-br-lg flex flex-col space-y-2 opacity-80 p-2 transition-opacity top-[-2px] z-20 duration-200 absolute dark:bg-gray-800 dark:border-gray-700 hover:opacity-100"
        >
          <!-- <div class="font-bold text-xl text-xs">Preview options</div> -->
          <div class="flex flex-col space-y-2 items-center">
            <button
              class="border rounded-full flex border-gray-500 h-8 transform transition-transform w-8 duration-200 checkerboard-sm !bg-white dark:border-gray-700 hover:scale-90"
              title="Set transparent background"
              type="button"
              use:tooltip
              on:click={() => (previewBg = '')}
            />
            <div class="transform z-20 duration-200 relative hover:scale-90">
              <input
                type="color"
                class="cursor-pointer opacity-0 z-20 absolute !h-8 !w-8"
                title="Pick preview background color"
                use:tooltip
                value="#ffffff"
                on:input={(e) => {
                  previewBg = e.currentTarget.value
                }}
                on:change={(e) => {
                  previewBg = e.currentTarget.value
                }}
              />
              <div
                class="flex text-gray-500 preview-button items-center justify-center"
                type="button"
              >
                <ColorPalette24 class="flex font-bold" />
              </div>
            </div>
            <button
              class="flex text-gray-500 preview-button"
              title="Set background from image"
              type="button"
              on:click={() => fileInput?.click()}
              use:tooltip
            >
              <Camera24 class="flex font-bold" />
            </button>
            {#if mockups?.length}
              <button
                class="flex text-gray-500 preview-button"
                title="Set background from gallery"
                type="button"
                on:click={() => (gallery = true)}
                use:tooltip
              >
                <ImageSearch24 class="flex font-bold" />
              </button>
            {/if}
            <input
              type="file"
              class="hidden"
              accept="image/*"
              on:change={(e) => onFileSelected(e)}
              bind:this={fileInput}
            />
          </div>
        </div>
      {/if}
      <div
        class="flex h-full w-full items-center justify-center relative"
        class:checkerboard={!previewBg}
        style:background={previewBg}
        class:!bg-cover={previewBg}
        class:!bg-center={previewBg}
      >
        {#if watermark}
          <div
            class="bg-repeat-space flex h-full w-full opacity-12 inset-0 absolute"
            style="background-image: url({useCaravaggio(
              $page.stuff.store?.logo || '',
              {
                o: 'png',
                rotate: {
                  v: 45,
                  b: '000000.00',
                },
                rs: {
                  s: 'x28',
                  m: 'scale',
                },
              }
            )})"
          />
        {/if}
        <Preview
          {template}
          fitParent
          scaleFactor={Math.max(previewScale[0] / 100, 0)}
          rotation={previewRotate[0]}
          draggable
          notLoadFonts={!showFonts}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .preview-button {
    @apply bg-white border rounded flex border-gray-400 shadow p-1 transform transition-transform duration-200;
    will-change: transform;
  }

  .preview-button:hover {
    @apply scale-90;
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
</style>
