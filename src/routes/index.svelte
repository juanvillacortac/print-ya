<script lang="ts">
  import { useWindiCSS } from '$lib/windicss'
  import Iframe from '$lib/Iframe.svelte'
  import type Processor from 'windicss'
  import Editor from '$lib/components/Editor.svelte'
  import { HSplitPane, VSplitPane } from 'svelte-split-pane'
  import { PaintBrush24, Copy16 } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import { onMount } from 'svelte'

  let formatHtml: () => {}
  let formatCss: () => {}

  const format = () => {
    formatHtml()
    formatCss()
  }

  onMount(() => {
    document.addEventListener('keydown', function (event) {
      if (event.altKey && event.shiftKey && event.key == 'F') {
        format()
      }
    })
  })

  let html = ''
  let css = ''
  let finalCss = ''
  let processor: Processor
  $: {
    const { processor: p, generatedCSS } = useWindiCSS(html, css, null)
    processor = p
    finalCss = generatedCSS
  }
</script>

{#if browser}
  <div class="flex flex-col h-screen w-full text-gray-700">
    <div
      class="bg-white flex shadow-lg w-full p-4 justify-between items-center"
    >
      <h2 class="font-bold text-xl">Print Ya!</h2>
      <div class="flex space-x-4">
        <PaintBrush24 on:click={format} />
      </div>
    </div>
    <div class="h-full bg-light-500">
      <HSplitPane>
        <VSplitPane slot="left">
          <div class="flex h-full w-full p-4" slot="top">
            <div
              class="bg-white rounded-lg flex flex-col h-full shadow w-full relative overflow-hidden"
            >
              <div class="flex w-full p-4 justify-between items-center">
                <h2 class="font-bold text-xs w-full text-gray-700 block">
                  Template
                </h2>
                <button
                  class="border-transparent rounded border-2 p-1 duration-200 hover:border-gray-100"
                  on:click={() => navigator.clipboard.writeText(html)}
                >
                  <Copy16 />
                </button>
              </div>
              {#if processor}
                <Editor
                  bind:format={formatHtml}
                  bind:modelValue={html}
                  language="html"
                  bind:processor
                />
              {/if}
            </div>
          </div>
          <div class="flex h-full w-full p-4" slot="down">
            <div
              class="bg-white rounded-lg flex flex-col h-full shadow w-full overflow-hidden"
            >
              <h2 class="font-bold text-xs w-full p-4 text-gray-700">Style</h2>
              {#if processor}
                <Editor
                  bind:format={formatCss}
                  bind:modelValue={css}
                  language="css"
                  bind:processor
                />
              {/if}
            </div>
          </div>
        </VSplitPane>
        <div class="flex h-full w-full relative" slot="right">
          <div
            class="flex h-full w-full inset-0 absolute select-none pointer-events-none"
          >
            <Iframe
              props={{
                html,
                css: finalCss,
                fixedCss: '',
                dark: false,
                classes: '',
              }}
            />
          </div>
        </div>
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
</style>
