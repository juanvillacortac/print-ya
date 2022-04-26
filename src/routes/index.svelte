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
  import Editor from '$lib/components/Editor.svelte'
  import { HSplitPane, VSplitPane } from 'svelte-split-pane'
  import {
    Sun24,
    Moon24,
    Warning32,
    Share24,
    ZoomIn16,
    ZoomOut16,
    ZoomFit16,
    Checkbox16,
    Script24,
    Settings24,
    Checkbox24,
    CloudUpload24,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import { persistentWritable, preferences } from '$lib'
  import { fade } from 'svelte/transition'
  import Preview from '$lib/components/Preview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import FieldEditor from '$lib/components/FieldEditor.svelte'
  import { notifications } from '$lib/components/notifications'
  import type { TemplateSource } from '$lib/compiler'

  export let data: string

  const modes = [
    {
      type: 'editor',
      title: 'Template editor',
      icon: Script24,
    },
    {
      type: 'settings',
      title: 'Template settings',
      icon: Settings24,
    },
  ]

  let mode: 'editor' | 'settings' | string = 'editor'

  const editor = persistentWritable<TemplateSource>('editorState', {
    name: 'Template test',
    html: '',
    css: '',
    fields: '',
    windi: true,
    width: 300,
    height: 300,
    sizeUnit: 'px',
  })

  $: if (data && browser) {
    const decoded = window.decodeURIComponent(window.atob(data))
    try {
      const payload = JSON.parse(decoded)
      $editor = payload
    } catch {}
  }

  let saveHandler

  const persist = () => {
    saved = true
  }

  $: if ($editor) {
    saved = false
    setTimeout(persist, 1000)
  }

  let saved = false

  let errorMsg = ''

  let border = true

  let scale = 100

  const zoomIn = () => (scale = Math.max(10, Math.min(scale + 10, 200)))
  const zoomOut = () => (scale = Math.max(10, Math.min(scale - 10, 200)))

  let save: () => void
</script>

{#if browser}
  <div
    class="flex flex-col h-screen w-full text-gray-700 overflow-hidden dark:text-white"
  >
    <!-- <div
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
          class="flex"
          use:tooltip
        >
          <Share24 />
        </button>
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="absolute">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
      </div>
    </div> -->
    <div
      class="bg-white border-b flex border-light-900 w-full p-2 px-4 z-50 justify-between items-center dark:bg-gray-800  dark:border-gray-800"
    >
      <input
        class="bg-transparent border-none ring-transparent !focus:outline-none p-0"
        placeholder="Template name"
        type="text"
        bind:value={$editor.name}
      />
      {#if saved}
        <div
          class="flex space-x-2 text-gray-400 dark:text-gray-600 items-center"
          transition:fade={{ duration: 200 }}
        >
          <CloudUpload24 />
          <p>Saved!</p>
        </div>
      {/if}
    </div>
    <div class="flex h-full w-full">
      <div
        class="bg-white border-r flex flex-col space-y-6 border-light-900 p-4 text-gray-500 z-20 dark:bg-gray-900 dark:border-gray-800"
      >
        {#each modes as m}
          <button
            title={m.title}
            use:tooltip
            class="flex hover:text-black dark:hover:text-white"
            class:text-black={mode == m.type}
            class:dark:text-white={mode == m.type}
            on:click={() => (mode = m.type)}
          >
            <svelte:component this={m.icon} />
          </button>
        {/each}
        <button
          on:click={() => {
            navigator.clipboard.writeText(
              `${window.location.protocol}//${window.location.host}${
                window.location.pathname
              }?data=${window.encodeURIComponent(
                window.btoa(JSON.stringify($editor))
              )}`
            )
            notifications.send('Copied to clipboard!', 'default', 1000)
          }}
          title="Copy share link"
          class="flex hover:text-black dark:hover:text-white"
          use:tooltip
        >
          <Share24 />
        </button>
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-black dark:hover:text-white"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="absolute pointer-events-none">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
      </div>
      <div class="h-full bg-light-500 w-full dark:bg-gray-900">
        <HSplitPane>
          <svelte:fragment slot="left">
            {#if mode == 'editor'}
              <VSplitPane>
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
            {/if}
            {#if mode == 'settings'}
              <div class="flex h-full w-full p-4">
                <FieldEditor bind:template={$editor} />
              </div>
            {/if}
          </svelte:fragment>
          <div class="flex h-full w-full relative" slot="right">
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
              class="flex h-full w-full absolute select-none checkerboard overflow-auto"
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
              <div class="h-full w-full absolute overflow-auto">
                <div
                  class="origin-top-left transition-transform duration-200"
                  style="transform: scale({scale / 100})"
                >
                  <Preview
                    template={$editor}
                    bind:error={errorMsg}
                    bind:saveImage={save}
                    bind:border
                  />
                </div>
              </div>
              <div
                class="flex space-x-1 right-1rem bottom-1rem absolute items-center"
              >
                <p class="font-bold text-xs pr-4">{scale}%</p>
                <button
                  class="bg-white rounded flex border-2 border-transparent shadow p-1 transform transition-transform duration-200 dark:border-transparent dark:bg-gray-700 dark:border-2 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Zoom Out"
                  use:tooltip
                  on:click={zoomOut}
                >
                  <ZoomOut16 class="font-bold" />
                </button>
                <button
                  class="bg-white rounded flex border-2 border-gray-500 shadow p-1 transform transition-transform duration-200 dark:border-transparent dark:bg-gray-700 dark:border-2 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Reset zoom"
                  use:tooltip
                  on:click={() => (scale = 100)}
                >
                  <ZoomFit16 class="font-bold" />
                </button>
                <button
                  class="bg-white rounded flex border-2 border-gray-500 shadow p-1 transform transition-transform duration-200 dark:border-transparent dark:bg-gray-700 dark:border-2 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Zoom In"
                  use:tooltip
                  on:click={zoomIn}
                >
                  <ZoomIn16 class="font-bold" />
                </button>
                <button
                  class="bg-white rounded flex border-2 border-gray-500 shadow p-1 transform transition-transform duration-200 dark:border-transparent dark:bg-gray-700 dark:border-2 hover:-translate-y-px dark:hover:border-gray-300"
                  title="Toggle border"
                  use:tooltip
                  on:click={() => (border = !border)}
                >
                  <Checkbox16 class="font-bold" />
                </button>
              </div>
            </div>
          </div>
        </HSplitPane>
      </div>
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
