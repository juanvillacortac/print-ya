<script lang="ts">
  import { onMount } from 'svelte'
  import { toPng } from 'html-to-image'
  import { preferences } from '$lib'
  import type { CompiledTemplate, TemplateSource } from '$lib/compiler'

  let element: HTMLDivElement
  let shadow: ShadowRoot

  let styleEl: HTMLStyleElement
  let containerEl: HTMLDivElement

  export let template: TemplateSource = {
    html: '',
    css: '',
    fields: '',
    useWindi: true,
  }

  export let error = ''

  let compiled: CompiledTemplate = {
    html: '',
    css: '',
  }

  let compiler: Worker

  onMount(async () => {
    shadow = element.attachShadow({ mode: 'open' })

    const CompilerWorker = await import('$lib/compiler.worker?worker').then(
      (m) => m.default
    )

    compiler = new CompilerWorker()

    compiler.onmessage = ({ data }: MessageEvent<CompiledTemplate>) => {
      compiled = data
      error = ''
    }

    compiler.onerror = (event) => {
      error = event.message
      compiled.html = template.html
    }
  })

  $: compiler?.postMessage(template)

  $: if (compiled.css && shadow) {
    if (styleEl) shadow.removeChild(styleEl)
    styleEl = document.createElement('style')
    styleEl.innerHTML = compiled.css
    shadow.appendChild(styleEl)

    const imports = compiled.css.match(/@import\ url\((.*?)\);/gim)

    if (imports?.length) {
      let shadowDomCssImports = document.getElementById('preview_fonts')
      if (!shadowDomCssImports) {
        shadowDomCssImports = document.createElement('style')
        shadowDomCssImports.id = 'preview_fonts'
        document.head.append(shadowDomCssImports)
      }
      shadowDomCssImports.innerHTML = imports.join('\n')
    } else {
      document.getElementById('preview_fonts')?.remove()
    }
  }

  export let border = false

  export let width: string | number = 300
  export let height: string | number = 300

  $: if (compiled.html && shadow) {
    if (containerEl) shadow.removeChild(containerEl)
    containerEl = document.createElement('div')
    const innerEl = document.createElement('div')
    containerEl.style.overflow = 'visible'
    containerEl.style.width = `${width}${typeof width === 'number' ? 'px' : ''}`
    containerEl.style.height = `${height}${
      typeof height === 'number' ? 'px' : ''
    }`
    containerEl.style.outline = border
      ? `2px dashed ${
          $preferences.darkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(10, 10, 10, 0.4)'
        }`
      : 'none'
    containerEl.style.outlineOffset = '-2px'
    containerEl = document.createElement('div')
    containerEl.style.overflow = 'visible'
    containerEl.style.width = `${width}${typeof width === 'number' ? 'px' : ''}`
    containerEl.style.height = `${height}${
      typeof height === 'number' ? 'px' : ''
    }`
    innerEl.style.width = `${width}${typeof width === 'number' ? 'px' : ''}`
    innerEl.style.height = `${height}${typeof height === 'number' ? 'px' : ''}`
    containerEl.style.outline = border
      ? `2px dashed ${
          $preferences.darkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(10, 10, 10, 0.4)'
        }`
      : 'none'
    containerEl.style.outlineOffset = '-2px'
    innerEl.innerHTML = compiled.html
    containerEl.appendChild(innerEl)
    shadow.appendChild(containerEl)
  }

  export const saveImage = () => {
    if (!containerEl) return
    toPng(containerEl.getElementsByTagName('div')[0], { skipFonts: true }).then(
      (dataUrl) => {
        var dl = document.createElement('a')
        document.body.appendChild(dl)
        dl.setAttribute('href', dataUrl)
        dl.setAttribute('download', `template-${+new Date()}.png`)
        dl.click()
      }
    )
  }
</script>

<div bind:this={element} class="relative" />
