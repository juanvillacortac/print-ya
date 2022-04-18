<script lang="ts">
  import type monaco from 'monaco-editor'
  import { onMount } from 'svelte'
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
  import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
  import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
  import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
  import { useWindiCSS } from '$lib/windicss'
  import Iframe from '$lib/Iframe.svelte'

  let divEl: HTMLDivElement = null
  let editor: monaco.editor.IStandaloneCodeEditor
  let Monaco: typeof monaco

  onMount(async () => {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorker: function (_moduleId: any, label: string) {
        if (label === 'json') {
          return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new htmlWorker()
        }
        if (label === 'typescript' || label === 'javascript') {
          return new tsWorker()
        }
        return new editorWorker()
      },
    }

    Monaco = await import('monaco-editor')

    editor = Monaco.editor.create(divEl, {
      value: '',
      language: 'html',
      automaticLayout: true,
    })

    editor.onDidChangeModelContent(() => {
      rendered = editor.getValue()
    })

    return () => {
      editor.dispose()
    }
  })

  let rendered = ''
  let css = ''
  $: css = useWindiCSS(rendered, '', null).generatedCSS
</script>

<div class="h-screen grid grid-cols-1 md:grid-cols-2">
  <div bind:this={divEl} class="h-full w-full" />
  <Iframe
    props={{
      html: rendered,
      css,
      fixedCss: '',
      dark: false,
      classes: '',
    }}
  />
</div>
