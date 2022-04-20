<script lang="ts">
  import { useWindiCSS } from '$lib/windicss'
  import Iframe from '$lib/Iframe.svelte'
  import type Processor from 'windicss'
  import Editor from '$lib/components/Editor.svelte'
  import { HSplitPane, VSplitPane } from 'svelte-split-pane'
  import { Sun24, Moon24, Error32, Warning32 } from 'carbon-icons-svelte'
  import { browser } from '$app/env'
  import { persistentWritable, preferences } from '$lib'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  let Handlebars

  onMount(async () => {
    Handlebars = await import('handlebars-esm')
  })

  const editor = persistentWritable('editorState', {
    html: '',
    css: '',
    fields: '',
  })

  let finalCss = ''
  let finalHtml = ''
  let processor: Processor
  let errorMsg = ''
  $: if (browser && Handlebars) {
    const template = Handlebars.default.compile($editor.html)
    try {
      finalHtml = template(JSON.parse($editor.fields || '{}'))
      errorMsg = ''
    } catch (err) {
      errorMsg = err.message
      finalHtml = $editor.html
    }
  }
  $: {
    const { processor: p, generatedCSS } = useWindiCSS(
      $editor.html,
      $editor.css,
      null
    )
    processor = p
    finalCss = generatedCSS
  }
</script>

{#if browser}
  <div
    class="flex flex-col h-screen w-full text-gray-700 dark:text-white overflow-hidden"
  >
    <div
      class="bg-white dark:bg-gray-800 flex shadow w-full p-4 justify-between items-center z-50"
    >
      <h2 class="font-bold text-xl">Print Ya!</h2>
      <div class="flex space-x-4">
        {#if !$preferences.darkMode}
          <Sun24
            on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          />
        {:else}
          <Moon24
            on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          />
        {/if}
      </div>
    </div>
    <div class="h-full bg-light-500 dark:bg-gray-900">
      <HSplitPane>
        <VSplitPane slot="left">
          <div class="flex h-full w-full p-4" slot="top">
            {#if processor}
              <Editor
                title="Template"
                bind:modelValue={$editor.html}
                language="html"
                bind:processor
              />
            {/if}
          </div>
          <div class="flex h-full w-full p-4" slot="down">
            {#if processor}
              <Editor
                title="Style"
                bind:modelValue={$editor.css}
                language="css"
                bind:processor
              />
            {/if}
          </div>
        </VSplitPane>
        <VSplitPane slot="right" topPanelSize="60%" downPanelSize="40%">
          <div class="flex h-full w-full relative" slot="top">
            {#if errorMsg}
              <div
                transition:fade={{ duration: 200 }}
                class="absolute z-20 bg-red-500 bg-opacity-50 backdrop-filter blur-20px inset-0 w-full h-full p-4 flex flex-col space-y-6 text-white overflow-auto"
                style="will-change: backdrop-filter"
              >
                <Warning32 class="w-24 h-24" />
                <pre>{errorMsg}</pre>
              </div>
            {/if}
            <div
              class="flex h-full w-full inset-0 absolute select-none checkerboard overflow-auto"
            >
              <Iframe
                props={{
                  html: finalHtml,
                  css: finalCss,
                  fixedCss: '',
                  dark: false,
                  classes: '',
                }}
              />
            </div>
          </div>
          <div class="flex h-full w-full relative p-4" slot="down">
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
