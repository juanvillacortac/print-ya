<script lang="ts">
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
        <div class="flex flex-col">
          <label class="block text-sm font-bold mb-2" for="fieldId">
            Field id
          </label>
          <input
            class="appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
            id="fieldId"
            type="text"
            placeholder="Ex. firstText"
          />
        </div>
        <div class="flex flex-col">
          <label class="block text-sm font-bold mb-2" for="fieldId">
            Field id
          </label>
          <input
            class="appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
            id="fieldId"
            type="text"
            placeholder="Ex. firstText"
          />
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
      <h2 class="font-bold text-xs w-full block">Template fields</h2>
    </div>
  </div>
</div>
