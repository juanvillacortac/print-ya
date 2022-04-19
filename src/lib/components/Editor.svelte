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

  export let language: 'html' | 'css' | 'json'

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
        str = JSON.stringify(JSON.parse(str), null, 2)
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
      extensions: [...extensions, keymap.of([indentWithTab])],
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
</script>

<div bind:this={divEl} class="h-full w-full" />

<style>
  div {
    --c-scrollbar: var(--windi-bc);
    --c-bg: var(--windi-bg);
    --tw-bg-opacity: 1;
  }
</style>
