<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { toPng, toSvg } from 'html-to-image'
  import { preferences } from '$lib'
  import type { CompiledTemplate, TemplateSource } from '$lib/compiler'

  let element: HTMLDivElement
  let shadow: ShadowRoot

  let styleEl: HTMLStyleElement
  let containerEl: HTMLDivElement
  let innerEl: HTMLDivElement

  export let template: TemplateSource = {
    html: '',
    css: '',
    fields: '',
    windi: true,
  }

  export let error = ''

  let compiled: CompiledTemplate = {
    html: '',
    css: '',
  }

  let compiler: Worker
  let debug = false

  onMount(async () => {
    shadow = element.attachShadow({ mode: 'open' })

    const CompilerWorker = await import('$lib/compiler.worker?worker').then(
      (m) => m.default
    )

    compiler = new CompilerWorker()

    compiler.onmessage = ({ data }: MessageEvent<CompiledTemplate>) => {
      if (debug) {
        console.log(data)
      }
      compiled = data
      error = ''
    }

    compiler.onerror = (event) => {
      error = event.message
      compiled.html = template.html
    }
  })

  onDestroy(() => {
    compiler?.terminate()
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
  export let fitParent = false

  const refreshLayout = () => {
    if (!containerEl || !innerEl) return
    containerEl.style.overflow = 'visible'
    containerEl.style.outline = border
      ? `2px dashed ${
          $preferences.darkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(10, 10, 10, 0.4)'
        }`
      : 'none'
    containerEl.style.outlineOffset = '-2px'
    containerEl = document.createElement('div')
    containerEl.style.width = `${compiled.width}`
    containerEl.style.height = `${compiled.height}`
    innerEl.style.width = `${compiled.width}`
    innerEl.style.height = `${compiled.height}`
    containerEl.style.outline = border
      ? `2px dashed ${
          $preferences.darkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(10, 10, 10, 0.4)'
        }`
      : 'none'
    containerEl.style.outlineOffset = '-2px'
  }

  $: if (compiled.html && shadow) {
    if (containerEl) shadow.removeChild(containerEl)
    containerEl = document.createElement('div')
    innerEl = document.createElement('div')
    refreshLayout()
    innerEl.innerHTML = compiled.html
    containerEl.appendChild(innerEl)
    shadow.appendChild(containerEl)
    if (fitParent) {
      const parent = element.parentElement
      console.log(parent)
      if (parent) {
        const scale = Math.min(
          parent.clientWidth / containerEl.clientWidth,
          parent.clientHeight / containerEl.clientHeight
        )
        console.log(innerEl.clientWidth)
        containerEl.style.transformOrigin = `top left`
        containerEl.style.transform = `scale(${scale})`
        containerEl.style.margin = 'auto'
      }
    }
  }

  export const saveImage = () => {
    if (!containerEl) return
    toSvg(containerEl.getElementsByTagName('div')[0], { skipFonts: true }).then(
      (dataUrl) => {
        var dl = document.createElement('a')
        document.body.appendChild(dl)
        dl.setAttribute('href', dataUrl)
        dl.setAttribute('download', `template-${+new Date()}.svg`)
        dl.click()
      }
    )
  }
</script>

<div bind:this={element} class="flex h-full w-full relative" />
