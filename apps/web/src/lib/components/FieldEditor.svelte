<script lang="ts">
  import type { TemplateSource } from '$lib/compiler'

  import { Settings24 } from 'carbon-icons-svelte'
  let titleHeight = 0
  let showGradient = true
  const scroll = (element: HTMLDivElement) => {
    element.addEventListener('scroll', () => {
      showGradient = !(
        element.scrollHeight - element.scrollTop ===
        element.clientHeight
      )
    })
  }

  export let template: TemplateSource

  let units = ['px', 'mm', 'cm', 'in']
</script>

<div
  class="bg-white rounded-xl flex flex-col h-full shadow w-full relative overflow-hidden dark:bg-gray-800 "
>
  <div
    class="bg-gradient-to-b from-transparent to-white h-20 w-full transform-gpu bottom-0 left-0 z-30 duration-1s absolute pointer-events-none dark:to-gray-800"
    style="will-change: transform"
    class:translate-y-100={!showGradient}
  />
  <div
    class="w-full inset-0 overflow-hidden absolute"
    style="padding-top: {titleHeight}px"
  >
    <div class="flex-col flex h-full w-full p-4 overflow-auto" use:scroll>
      <div class="flex-col flex space-y-4">
        <div class="flex space-x-4 w-full">
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Width
            </label>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              id="fieldId"
              type="number"
              placeholder="Ex. 200"
              bind:value={template.width}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Height
            </label>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="Ex. 200"
              bind:value={template.height}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Size unit
            </label>
            <select
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={template.sizeUnit}
            >
              {#each units as unit}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="flex w-full p-2 justify-between items-center"
    bind:clientHeight={titleHeight}
  >
    <div class="flex space-x-2 py-1 items-center">
      <Settings24 />
      <h2 class="font-bold text-xs w-full block">Template settings</h2>
    </div>
  </div>
</div>
