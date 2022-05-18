<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { toPng } from 'html-to-image'
  import { preferences } from '$lib'
  import type { CompiledTemplate, TemplateSource } from '$lib/compiler'
  import type { Prisma } from '@prisma/client'
  import { session } from '$app/stores'

  let parent: HTMLDivElement
  let element: HTMLDivElement
  let shadow: ShadowRoot

  let styleEl: HTMLStyleElement
  let containerEl: HTMLDivElement
  let innerEl: HTMLDivElement

  export let template: TemplateSource | Prisma.JsonValue = {
    html: '',
    css: '',
    fields: '',
    windi: true,
  }
  $: source = template as TemplateSource

  export let error = ''

  export let compiled: CompiledTemplate = {
    html: '',
    css: '',
  }

  let compiler: Worker
  let debug = false

  onMount(async () => {
    const bot = !!$session?.userAgent?.match(
      'Lighthouse|Google Page Speed Insights|Googlebot'
    )
    if (bot) {
      return
    }
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
      compiled.html = source.html
    }
  })

  onDestroy(() => {
    compiler?.terminate()
  })

  $: compiler?.postMessage(source)

  $: if (compiled.css && shadow) {
    if (styleEl) shadow.removeChild(styleEl)
    styleEl = document.createElement('style')
    styleEl.innerHTML = compiled.css
      .replace('html {', ':host > * {')
      .replace('body {', ':host > * {')
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
    element.style.width = `${compiled.width}`
    element.style.height = `${compiled.height}`
    containerEl.style.overflow = 'visible'
    containerEl = document.createElement('div')
    containerEl.style.width = `${compiled.width}`
    containerEl.style.height = `${compiled.height}`
    innerEl.style.width = `${compiled.width}`
    innerEl.style.height = `${compiled.height}`
  }

  $: if ((compiled.html || compiled.html === '') && shadow) {
    if (containerEl) shadow.removeChild(containerEl)
    containerEl = document.createElement('div')
    innerEl = document.createElement('div')
    refreshLayout()
    innerEl.innerHTML = compiled.html
    containerEl.appendChild(innerEl)
    shadow.appendChild(containerEl)
    scaleLayout()
  }

  $: if (containerEl) {
    let containerStyles = shadow.getElementById('container-styles')
    if (!containerStyles) {
      containerStyles = document.createElement('style')
      containerStyles.id = 'container-styles'
      shadow.append(containerStyles)
    } else {
      document.getElementById('container-styles')?.remove()
    }
    containerStyles.innerHTML = `.outlined {
      position: relative;  
    }
    .outlined:after {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      content: '';
      outline: ${
        border
          ? `2px dashed ${
              $preferences.darkMode
                ? 'rgba(255, 255, 255, 0.5)'
                : 'rgba(10, 10, 10, 0.4)'
            }`
          : 'none'
      };
      outline-offset: -2px;
    }`

    containerEl.classList.toggle('outlined', true)
    // containerEl.style.outline = border
    //   ? `2px dashed ${
    //       $preferences.darkMode
    //         ? 'rgba(255, 255, 255, 0.5)'
    //         : 'rgba(10, 10, 10, 0.4)'
    //     }`
    //   : 'none'
    // containerEl.style.outlineOffset = '-2px'
    innerEl.style.position = 'relative'
  }

  let scale = 1

  const scaleLayout = () => {
    if (fitParent && innerEl) {
      // const parent = element.parentElement
      if (parent) {
        const { width: pw, height: ph } = parent.getBoundingClientRect()
        const cw = innerEl.offsetWidth
        const ch = innerEl.offsetHeight
        scale = Math.min(pw / cw, ph / ch)
        element.style.transform = `scale(${scale})`
      }
    }
  }

  export const saveImage = () => {
    if (!containerEl) return
    toPng(containerEl.getElementsByTagName('div')[0], { skipFonts: true }).then(
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

<svelte:window on:resize|passive={scaleLayout} />

<div bind:this={parent} class:fitParent>
  <div bind:this={element} />
</div>

<style>
  * > div {
    position: relative;
    color: initial;
    font-family: initial;
  }
  div > div {
    position: relative;
    position: absolute;
    transform-origin: center;
  }
  .fitParent {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
  }
</style>
