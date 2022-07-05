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
    CloudUpload24,
    Logout24,
    ArrowLeft20,
    Redo24,
  } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import { preferences } from '$lib'
  import { fade } from 'svelte/transition'
  import Preview from '$lib/components/Preview.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import FieldEditor from '$lib/components/FieldEditor.svelte'
  import { notifications } from '$lib/components/notifications'
  import { del, post } from '$lib/api'
  import { goto } from '$app/navigation'
  import { writable } from 'svelte/store'
  import { page } from '$app/stores'
  import type { Product, Store } from '$lib/db'
  import type { TemplateSource } from '$lib/compiler'
  import { squareratio } from '$lib/actions/aspectratio'
  import client from '$lib/trpc/client'
  import { onMount } from 'svelte'
  import trpc from '$lib/trpc/client'

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

  const editor = writable(
    { ...($page.stuff.product?.templateDraft as any) } || {
      name: 'Template test',
      html: '',
      css: '',
      fields: '',
      windi: true,
      width: 300,
      height: 300,
      sizeUnit: 'px',
    }
  )

  $: if (data && browser) {
    const decoded = window.decodeURIComponent(window.atob(data))
    try {
      const payload = JSON.parse(decoded)
      $editor = payload
    } catch {}
  }

  let store: Store
  $: store = $page.stuff.store as Store

  let product: Product
  $: product = $page.stuff.product as Product

  let saving = false

  const persist = async () => {
    try {
      saving = true
      await client().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          ...product,
          templateDraft: $editor,
        },
      })
      // await post(`/api/stores/${store.slug}/products`, {
      //   ...product,
      //   templateDraft: $editor,
      // })
      saved = true
    } catch (err) {
      notifications.send(err.message, 'default', 3000)
    } finally {
      saving = false
    }
  }

  const toProduction = async () => {
    try {
      saving = true
      await client().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          ...product,
          template: $editor,
          templateDraft: $editor,
        },
      })
      notifications.send('Template published', 'default', 3000)
    } catch (err) {
      notifications.send(err.message, 'default', 3000)
    } finally {
      saving = false
    }
  }

  const rollBack = async () => {
    try {
      saving = true

      $editor = { ...($page.stuff.product?.template as any) } || {
        name: 'Template test',
        html: '',
        css: '',
        fields: '',
        windi: true,
        width: 300,
        height: 300,
        sizeUnit: 'px',
      }
      await client().mutation('products:upsert', {
        storeSlug: store.slug,
        data: {
          ...product,
          template: $editor,
          templateDraft: $editor,
        },
      })
      notifications.send('Template published', 'default', 3000)
    } catch (err) {
      notifications.send(err.message, 'default', 3000)
    } finally {
      saving = false
    }
  }

  let timeout: NodeJS.Timeout

  onMount(() => {
    const unsubscribe = editor.subscribe((editor) => {
      console.log(editor, product.templateDraft)
      if (JSON.stringify(product?.templateDraft) !== JSON.stringify(editor)) {
        saved = false
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = setTimeout(persist, 2000)
      }
    })
    return () => {
      unsubscribe()
    }
  })

  let saved = false

  let errorMsg = ''

  let border = true

  let scale = 100

  const zoomIn = () => (scale = Math.max(10, Math.min(scale + 10, 200)))
  const zoomOut = () => (scale = Math.max(10, Math.min(scale - 10, 200)))

  let save: () => void
</script>

{#if browser}
  <div class="flex flex-col h-screen w-full overflow-hidden">
    <!-- <div
      class="bg-white flex shadow w-full p-4 z-50 justify-between items-center dark:bg-gray-800"
    >
      <h2 class="font-bold text-xl">ShackCart</h2>
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
      <div class="flex space-x-4 items-center">
        <a
          href="."
          class="flex text-gray-400 hover:text-black dark:hover:text-white"
          title="Go back to product page"
          use:tooltip
        >
          <ArrowLeft20 />
        </a>
        <h2>{$editor.name}</h2>
      </div>
      {#if saved}
        <div
          class="flex space-x-2 text-gray-500 items-center dark:text-gray-500"
          transition:fade={{ duration: 200 }}
        >
          <CloudUpload24 />
          <p>Saved as draft</p>
        </div>
      {/if}
    </div>
    <div class="flex h-full w-full">
      <div
        class="bg-white border-r flex flex-col h-full space-y-6 border-light-900 p-4 text-gray-400 z-20 justify-between dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex flex-col h-full space-y-6">
          <a
            class="flex h-24px w-24px relative items-center justify-center"
            href="/"
            title="Home"
            use:tooltip
          >
            <div
              class="rounded-lg h-auto bg-gray-100 -left-4px w-[calc(100%+8px)] absolute dark:bg-gray-800"
              use:squareratio
              style="aspect-ratio: 1/1"
            />

            <svg
              viewBox="0 0 50 39"
              class="h-full m-auto w-full relative"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
                class="ccompli1  !dark:fill-white"
                fill="#007AFF"
              />
              <path
                d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
                class="ccustom  !dark:fill-white"
                fill="#312ECB"
              />
            </svg>
            <!-- <h1
              class="font-logo font-black text-transparent text-center text-2xl select-none pointer-events-none rainbow-bg relative !bg-clip-text"
            >
              PY!
            </h1> -->
          </a>
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
            on:click={rollBack}
            title="Roll back draft"
            class="flex text-red-500"
            use:tooltip
          >
            <Redo24 />
          </button>
          <button
            on:click={toProduction}
            title="Save as public template"
            class="flex text-blue-500"
            use:tooltip
          >
            <CloudUpload24 />
          </button>
        </div>
        <div class="flex flex-col space-y-6">
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
          <button
            on:click={() => {
              trpc()
                .mutation('user:logout')
                .then(() => {
                  notifications.send('Log out successfully', 'default', 1000)
                  goto('/login')
                })
            }}
            class="flex relative justify-self-end self-end hover:text-black dark:hover:text-white"
            title="Log out"
            use:tooltip
            style="width: 24px; height: 24px"
          >
            <Logout24 />
          </button>
        </div>
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
                class="flex space-x-1 transition-opacity bottom-1rem left-1rem duration-200 absolute items-center"
                class:opacity-0={!saving}
              >
                <svg
                  role="status"
                  class="h-8 mr-2 animate-spin fill-blue-500 w-8 !text-transparent dark:text-gray-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
              <div
                class="flex space-x-1 right-1rem bottom-1rem absolute items-center"
              >
                <p class="font-bold text-xs pr-4">{scale}%</p>
                <button
                  class="preview-button"
                  title="Zoom Out"
                  use:tooltip
                  on:click={zoomOut}
                >
                  <ZoomOut16 class="font-bold" />
                </button>
                <button
                  class="preview-button"
                  title="Reset zoom"
                  use:tooltip
                  on:click={() => (scale = 100)}
                >
                  <ZoomFit16 class="font-bold" />
                </button>
                <button
                  class="preview-button"
                  title="Zoom In"
                  use:tooltip
                  on:click={zoomIn}
                >
                  <ZoomIn16 class="font-bold" />
                </button>
                <button
                  class="preview-button"
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

  .preview-button {
    @apply bg-white border-transparent rounded flex border-2 shadow p-1 transform transition-transform duration-200;
  }

  .preview-button:hover {
    @apply -translate-y-px;
  }

  :global(.dark) .preview-button {
    @apply border-transparent bg-gray-700 border-2  border-gray-300;
  }

  :global(.dark) .preview-button:hover {
    @apply border-gray-300;
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
