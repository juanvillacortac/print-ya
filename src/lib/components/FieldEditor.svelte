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
  class="bg-white dark:bg-gray-800 rounded-xl flex flex-col h-full shadow w-full relative overflow-hidden relative"
>
  <div
    class="absolute pointer-events-none h-20 w-full bg-gradient-to-b from-transparent to-white dark:to-gray-800 z-30 bottom-0 left-0 duration-1s transform-gpu"
    style="will-change: transform"
    class:translate-y-100={!showGradient}
  />
  <div
    class="w-full overflow-hidden absolute inset-0"
    style="padding-top: {titleHeight}px"
  >
    <div class="w-full h-full flex-col flex p-4 overflow-auto" use:scroll>
      <div class="flex-col flex space-y-4">
        <div class="flex space-x-4 w-full">
          <div class="flex flex-col w-full">
            <label class="block text-sm font-bold mb-2" for="fieldId">
              Width
            </label>
            <input
              class="appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
              id="fieldId"
              type="number"
              placeholder="Ex. 200"
              bind:value={template.width}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="block text-sm font-bold mb-2" for="fieldId">
              Height
            </label>
            <input
              class="appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
              type="number"
              placeholder="Ex. 200"
              bind:value={template.height}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="block text-sm font-bold mb-2" for="fieldId">
              Size unit
            </label>
            <select
              class="appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
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
    <div class="flex space-x-2 items-center py-1">
      <Settings24 />
      <h2 class="font-bold text-xs w-full block">Template settings</h2>
    </div>
  </div>
</div>
