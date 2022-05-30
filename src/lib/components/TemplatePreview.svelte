<script>
  import Slider from 'svelte-range-slider-pips'
  import { squareratio } from '$lib/actions/aspectratio'
  import { Camera24, Rotate16, ZoomIn16, ZoomOut16 } from 'carbon-icons-svelte'
  import { tooltip } from './tooltip'
  import RgbWheel from './__RGBWheel.svelte'
  import Preview from './Preview.svelte'
  import { useCaravaggio } from './caravaggio/useCaravaggio'
  import { page } from '$app/stores'

  /** @type {import('$lib/compiler').TemplateSource} */
  export let template

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
</script>

<div class="flex h-full w-full relative items-start">
  <div
    class="border rounded-lg h-auto border-gray-300 w-full top-0 col-span-1 sticky overflow-hidden relative select-none  dark:border-gray-800"
    style="aspect-ratio: 1/1"
    use:squareratio
  >
    <div
      class="flex flex-col h-full w-full top-0 z-20 absolute pointer-events-none items-center justify-end"
    >
      <div
        class="flex opacity-50 transition-opacity duration-200 pointer-events-auto items-center hover:opacity-100"
      >
        <div class="rounded-lg flex bg-red-500 p-6px">
          <Rotate16 class="text-white" />
        </div>
        <div class="w-200px">
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
        <div class="rounded-lg flex bg-red-500 p-6px">
          <Rotate16 class="text-white" style="transform: scale(-1, 1);" />
        </div>
      </div>
    </div>
    <div
      class="flex h-full w-full top-0 z-20 absolute pointer-events-none items-center justify-end"
    >
      <div
        class="flex flex-col opacity-50 transition-opacity duration-200 pointer-events-auto items-center hover:opacity-100"
      >
        <div class="rounded-lg flex bg-red-500 p-6px">
          <ZoomIn16 class="text-white" />
        </div>
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
        <div class="rounded-lg flex bg-red-500 p-6px">
          <ZoomOut16 class="text-white" />
        </div>
      </div>
    </div>
    <div
      class="flex space-x-2 opacity-50 transition-opacity top-2 left-2 z-20 duration-200 absolute items-center hover:opacity-100"
    >
      <div class="transform z-20 duration-200 relative hover:scale-90">
        <input
          type="color"
          class="cursor-pointer opacity-0 z-20 absolute !h-8 !w-8"
          title="Change preview background"
          use:tooltip
          value="#ffffff"
          on:input={(e) => {
            previewBg = e.currentTarget.value
          }}
          on:change={(e) => {
            previewBg = e.currentTarget.value
          }}
        />
        <RgbWheel
          class="border rounded-full flex border-gray-500 h-10 transform w-10 dark:border-gray-700"
        />
      </div>
      <button
        class="border rounded-full flex border-gray-500 h-10 transform transition-transform w-10 duration-200 checkerboard-sm !bg-white dark:border-gray-700 hover:scale-90"
        title="Set transparent background"
        use:tooltip
        on:click={() => (previewBg = '')}
      />
      <button
        class="flex text-gray-500 preview-button"
        title="Set background from image"
        type="button"
        on:click={() => fileInput?.click()}
        use:tooltip
      >
        <Camera24 class="flex font-bold" />
      </button>
      <input
        type="file"
        class="hidden"
        accept=".jpg, .jpeg, .png"
        on:change={(e) => onFileSelected(e)}
        bind:this={fileInput}
      />
    </div>
    <div
      class="flex h-full w-full items-center justify-center relative"
      class:checkerboard={!previewBg}
      style:background={previewBg}
      class:!bg-cover={previewBg}
      class:!bg-center={previewBg}
    >
      <div
        class="bg-repeat-space flex h-full w-full opacity-12 inset-0 absolute"
        style="background-image: url({useCaravaggio($page.stuff.store.logo, {
          o: 'png',
          rotate: {
            v: 45,
            b: '000000.00',
          },
          rs: {
            s: 'x28',
            m: 'scale',
          },
        })})"
      />
      <Preview
        {template}
        fitParent
        scaleFactor={Math.max(previewScale[0] / 100, 0)}
        rotation={previewRotate[0]}
        draggable
        notLoadFonts
      />
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
</style>
