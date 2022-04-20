<script lang="ts">
  import 'prism-theme-vars/base.css'
  import 'codemirror-theme-vars/base.css'
  import 'prism-theme-vars/to-codemirror.css'
  import './editor.css'
  import { onMount } from 'svelte'

  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap, ViewPlugin } from '@codemirror/view'
  import { StreamLanguage } from '@codemirror/stream-parser'
  import { html } from '@codemirror/lang-html'
  import { json } from '@codemirror/lang-json'
  import { css } from '@codemirror/legacy-modes/mode/css'
  import type Processor from 'windicss'
  import { abbreviationTracker } from '@emmetio/codemirror6-plugin'

  import { basicSetup, hoverPreview } from '$lib/editorplugin'
  import { indentWithTab } from '@codemirror/commands'
  import prettier from 'prettier'
  import prettierHtml from 'prettier/parser-html'
  import prettierCss from 'prettier/parser-postcss'
  import {
    Copy16,
    PaintBrushAlt16,
    Maximize16,
    Code24,
    ColorPalette24,
    Json24,
  } from 'carbon-icons-svelte'
  import { tooltip } from './tooltip'
  import Fullscreen from 'svelte-fullscreen'

  export let language: 'html' | 'css' | 'json'

  export let title = ''
  export let modelValue = ''
  let divEl: HTMLDivElement = null

  let view: EditorView | null = null
  let state: EditorState | null = null

  export const format = () => {
    let str = modelValue
    switch (language) {
      case 'html':
        str = prettier.format(str, {
          semi: false,
          parser: 'html',
          plugins: [prettierHtml],
        })
        break
      case 'css':
        str = prettier.format(str, {
          semi: false,
          parser: 'css',
          plugins: [prettierCss],
        })
        break
      case 'json':
        try {
          str = JSON.stringify(JSON.parse(str), null, 2)
        } catch {}
        break
    }
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: str },
    })
  }

  const reactivePlugin = ViewPlugin.define((view) => {
    return {
      update(update) {
        if (update.docChanged) {
          const value = view.state.doc.toString()
          modelValue = value
        }
      },
    }
  })

  export let processor: Processor = null
  async function initEditor() {
    const extensions = [basicSetup, reactivePlugin]

    if (processor) {
      console.log(processor)
      extensions.push(hoverPreview(processor))
    }

    switch (language) {
      case 'html':
        extensions.push(html())
        extensions.push(abbreviationTracker())
        break
      case 'css':
        extensions.push(StreamLanguage.define(css))
        break
      case 'json':
        extensions.push(json())
        break
    }

    state = EditorState.create({
      doc: modelValue,
      extensions: [
        ...extensions,
        keymap.of([indentWithTab]),
        keymap.of([
          {
            preventDefault: true,
            run: () => {
              format()
              return true
            },
            key: 'Shift-Alt-f',
          },
        ]),
      ],
    })

    view = new EditorView({
      state,
      parent: divEl!,
    })
  }

  onMount(async () => {
    await initEditor()
    return () => {
      view?.destroy()
    }
  })

  let titleHeight = 0
</script>

<Fullscreen let:onToggle>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl flex flex-col h-full shadow w-full relative overflow-hidden relative"
  >
    <div
      bind:this={divEl}
      class="w-full overflow-hidden absolute inset-0"
      style="padding-top: {titleHeight}px"
    />
    <div
      class="flex w-full p-2 justify-between items-center"
      bind:clientHeight={titleHeight}
    >
      <div class="flex space-x-2 items-center">
        {#if language === 'html'}
          <Code24 />
        {:else if language === 'css'}
          <ColorPalette24 />
        {:else if language === 'json'}
          <Json24 />
        {/if}
        <h2 class="font-bold text-xs w-full block">{title}</h2>
      </div>
      <div class="items-center flex space-x-1">
        <button
          class="border-transparent rounded border-2 p-1 duration-200 hover:border-gray-300"
          on:click={format}
          title="Format document (Shift+Alt+F)"
          use:tooltip
        >
          <PaintBrushAlt16 class="font-bold" />
        </button>
        <button
          class="border-transparent rounded border-2 p-1 duration-200 hover:border-gray-300"
          on:click={() => navigator.clipboard.writeText(modelValue)}
          title="Copy to clipboard"
          use:tooltip
        >
          <Copy16 class="font-bold" />
        </button>
        <button
          class="border-transparent rounded border-2 p-1 duration-200 hover:border-gray-300"
          on:click={onToggle}
          title="Toggle fullscreen"
          use:tooltip
        >
          <Maximize16 class="font-bold" />
        </button>
      </div>
    </div>
  </div>
</Fullscreen>

<style>
  div {
    --c-scrollbar: var(--windi-bc);
    --c-bg: var(--windi-bg);
    --tw-bg-opacity: 1;
  }
</style>
