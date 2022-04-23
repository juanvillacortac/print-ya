<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  export const load: Load = ({ url }) => {
    const data = url.searchParams.get('data')

    return {
      props: {
        data,
      },
    }
  }
</script>

<script lang="ts">
  import { useWindiCSS } from '$lib/windicss'
  import type Processor from 'windicss'
  import Editor from '$lib/components/Editor.svelte'
  import { HSplitPane, VSplitPane } from 'svelte-split-pane'
  import {
    Sun24,
    Moon24,
    Warning32,
    Share24,
    Add16,
    Subtract16,
    ZoomIn16,
    ZoomOut16,
    ZoomFit16,
    Checkbox16,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import { persistentWritable, preferences } from '$lib'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import Preview from '$lib/components/Preview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type {
    CompilerMessage,
    CompilerPostMessage,
  } from '$lib/compiler.worker'

  export let data: string

  const editor = persistentWritable('editorState', {
    html: '',
    css: '',
    fields: '',
  })

  $: if (data && browser) {
    const decoded = window.decodeURIComponent(window.atob(data))
    try {
      const payload = JSON.parse(decoded)
      $editor = payload
    } catch {}
  }

  let compiler: Worker

  let finalCss = ''
  let finalHtml = ''
  let errorMsg = ''
  let processor: Processor

  onMount(async () => {
    const CompilerWorker = await import('$lib/compiler.worker?worker').then(
      (m) => m.default
    )
    compiler = new CompilerWorker()

    compiler.onmessage = ({ data }: MessageEvent<CompilerMessage>) => {
      processor = data.processor
      finalHtml = data.html
      finalCss = data.css
      errorMsg = ''
    }

    compiler.onerror = (event) => {
      errorMsg = event.message
      finalHtml = $editor.html
    }
  })

  let border = false

  $: compiler?.postMessage($editor as CompilerPostMessage)

  // $: if (browser && Handlebars) {
  //   const template = Handlebars.default.compile($editor.html)
  //   try {
  //     finalHtml = template(JSON.parse($editor.fields || '{}'))
  //     errorMsg = ''
  //   } catch (err) {
  //     errorMsg = err.message
  //     finalHtml = $editor.html
  //   }
  // }
  // $: {
  //   const { processor: p, generatedCSS } = useWindiCSS(
  //     $editor.html,
  //     $editor.css,
  //     null
  //   )
  //   processor = p
  //   finalCss = generatedCSS
  // }

  let scale = 100

  const zoomIn = () => (scale = Math.max(10, Math.min(scale + 10, 200)))
  const zoomOut = () => (scale = Math.max(10, Math.min(scale - 10, 200)))

  let save: () => void
</script>

{#if browser}
  <div
    class="flex flex-col h-screen w-full text-gray-700 overflow-hidden dark:text-white"
  >
    <div
      class="bg-white flex shadow w-full p-4 z-50 justify-between items-center dark:bg-gray-800"
    >
      <h2 class="font-bold text-xl">Print Ya!</h2>
      <div class="flex space-x-4 items-center">
        <button
          class="rounded-lg font-bold border-2 border-blue-500 text-sm py-2 px-2 transform-gpu text-blue-500 duration-200 hover:shadow hover:-translate-y-px"
          on:click={save}>Export as image</button
        >
        <button
          on:click={() =>
            navigator.clipboard.writeText(
              `${window.location.protocol}//${window.location.host}${
                window.location.pathname
              }?data=${window.encodeURIComponent(
                window.btoa(JSON.stringify($editor))
              )}`
            )}
          title="Copy share link"
          use:tooltip
        >
          <Share24 />
        </button>
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
        >
          <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
        </button>
      </div>
    </div>
    <div class="h-full bg-light-500 dark:bg-gray-900">
      <HSplitPane>
        <VSplitPane slot="left">
          <div class="flex h-full w-full p-4 relative" slot="top">
            <Editor
              title="Template"
              bind:modelValue={$editor.html}
              language="html"
            />
          </div>
          <div class="flex h-full w-full p-4" slot="down">
            <Editor
              title="Style"
              bind:modelValue={$editor.css}
              language="css"
            />
          </div>
        </VSplitPane>
        <VSplitPane slot="right" topPanelSize="60%" downPanelSize="40%">
          <div class="flex h-full w-full relative" slot="top">
            {#if errorMsg}
              <div
                transition:fade={{ duration: 200 }}
                class="flex flex-col h-full space-y-6 bg-red-500 bg-opacity-50 text-white text-sm w-full p-4 inset-0 z-20 absolute backdrop-filter overflow-auto blur-20px"
                style="will-change: backdrop-filter"
              >
                <Warning32 class="h-24 w-24" />
                <pre>{errorMsg}</pre>
              </div>
            {/if}
            <div
              class="flex h-full w-full inset-0 absolute select-none checkerboard overflow-auto"
              on:wheel={(e) => {
                if (e.ctrlKey) {
                  e.preventDefault()
                  if (e.deltaY > 0) {
                    zoomOut()
                  } else {
                    zoomIn()
                  }
                }
              }}
            >
              <div class="absolute w-full h-full overflow-auto">
                <div
                  class="origin-top-left transition-transform duration-200"
                  style="transform: scale({scale / 100})"
                >
                  <Preview
                    html={finalHtml}
                    css={finalCss}
                    bind:saveImage={save}
                    bind:border
                  />
                </div>
              </div>
              <div
                class="flex space-x-1 right-1rem bottom-1rem absolute items-center"
              >
                <p class="font-bold text-xs">{scale}%</p>
                <button
                  class="bg-white border-transparent rounded border-2 shadow p-1 transform transition-transform duration-200 dark:bg-gray-700 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Zoom Out"
                  use:tooltip
                  on:click={zoomOut}
                >
                  <ZoomOut16 class="font-bold" />
                </button>
                <button
                  class="bg-white border-transparent rounded border-2 shadow p-1 transform transition-transform duration-200 dark:bg-gray-700 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Reset zoom"
                  use:tooltip
                  on:click={() => (scale = 100)}
                >
                  <ZoomFit16 class="font-bold" />
                </button>
                <button
                  class="bg-white border-transparent rounded border-2 shadow p-1 transform transition-transform duration-200 dark:bg-gray-700 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Zoom In"
                  use:tooltip
                  on:click={zoomIn}
                >
                  <ZoomIn16 class="font-bold" />
                </button>
                <button
                  class="bg-white border-transparent rounded border-2 shadow p-1 transform transition-transform duration-200 dark:bg-gray-700 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Toggle border"
                  use:tooltip
                  on:click={() => (border = !border)}
                >
                  <Checkbox16 class="font-bold" />
                </button>
              </div>
            </div>
          </div>
          <div class="flex h-full w-full p-4 relative" slot="down">
            <Editor
              title="Template fields"
              language="json"
              bind:modelValue={$editor.fields}
            />
            <!-- <FieldEditor /> -->
          </div>
        </VSplitPane>
      </HSplitPane>
    </div>
  </div>
{/if}

<style>
  :global(.splitpanes__pane) {
    background-color: transparent !important;
  }

  :global(.splitpanes__splitter) {
    border: none !important;
    background-color: transparent !important;
  }

  :global(.separator) {
    @apply transition-opacity duration-100;
    opacity: 0.2;
  }
  :global(.separator:hover) {
    opacity: 0.4;
  }

  .checkerboard {
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
</style>
