<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { toPng, toSvg } from 'html-to-image'
  import { preferences } from '$lib'
  import type { CompiledTemplate, TemplateSource } from '$lib/compiler'
  import { RGBADepthPacking } from 'three'

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
    containerEl = document.createElement('div')
    containerEl.style.width = fitParent ? '100%' : `${compiled.width}`
    containerEl.style.height = fitParent ? '100%' : `${compiled.height}`
    innerEl.style.width = `${compiled.width}`
    innerEl.style.height = `${compiled.height}`
  }

  $: if (compiled.html && shadow) {
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

  const scaleLayout = () => {
    if (fitParent && innerEl) {
      const parent = element.parentElement
      if (parent) {
        const scale = Math.min(
          parent.clientWidth / innerEl.offsetWidth,
          parent.clientHeight / innerEl.offsetHeight
        )
        containerEl.style.display = 'flex'
        containerEl.style.alignItems = 'center'
        containerEl.style.justifyContent = 'center'
        innerEl.style.transformOrigin = 'center'
        innerEl.style.transform = `scale(${scale})`
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

<svelte:window on:resize|passive={scaleLayout} />

<div bind:this={element} class="relative" />
