<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { toPng, toSvg } from 'html-to-image'
  import { preferences } from '$lib'
  import type { CompiledTemplate, TemplateSource } from '$lib/compiler'

  let parent: HTMLDivElement
  let element: HTMLDivElement
  let shadow: ShadowRoot

  let styleEl: HTMLStyleElement
  let containerEl: HTMLDivElement
  let innerEl: HTMLDivElement

  function generateUID() {
    const firstPart = (Math.random() * 46656) | 0
    const secondPart = (Math.random() * 46656) | 0
    return (
      ('000' + firstPart.toString(36)).slice(-3) +
      ('000' + secondPart.toString(36)).slice(-3)
    )
  }

  export let template: TemplateSource = {
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

  export let notLoadFonts = false
  export let scaleFactor = 1
  export let rotation = 0

  let uid: string

  onMount(async () => {
    uid = generateUID()
    const bot = !!navigator.userAgent.match(
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
    if (typeof document !== 'undefined') {
      document?.getElementById(`preview_fonts-${uid}`)?.remove()
    }
  })

  $: compiler?.postMessage(source)

  $: if (compiled.css && shadow && uid) {
    if (styleEl) shadow.removeChild(styleEl)
    styleEl = document.createElement('style')
    styleEl.innerHTML = compiled.css
      .replace('html {', ':host > * {')
      .replace('body {', ':host > * {')
    shadow.appendChild(styleEl)

    const imports = compiled.css.match(/@import\ url\((.*?)\);/gim)

    if (imports?.length && !notLoadFonts) {
      let shadowDomCssImports = document.getElementById(`preview_fonts-${uid}`)
      if (!shadowDomCssImports) {
        shadowDomCssImports = document.createElement('style')
        shadowDomCssImports.id = `preview_fonts-${uid}`
        document.head.append(shadowDomCssImports)
      }
      shadowDomCssImports.innerHTML = imports.join('\n')
    } else {
      document.getElementById(`preview_fonts-${uid}`)?.remove()
    }
  }

  export let draggable = false
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

  let hovering = false

  $: if ((compiled.html || compiled.html === '') && shadow) {
    if (!containerEl) {
      containerEl = document.createElement('div')
      innerEl = document.createElement('div')
      innerEl.id = 'inner'
      containerEl.appendChild(innerEl)
      shadow.appendChild(containerEl)
      if (draggable) {
        innerEl.addEventListener('mouseover', (e) => {
          e.preventDefault()
          hovering = true
        })
        innerEl.addEventListener('mouseleave', (e) => {
          e.preventDefault()
          hovering = false
          previousTouch = null
        })
        innerEl.addEventListener('mousedown', (e) => {
          e.preventDefault()
          moving = true
        })
        innerEl.addEventListener('touchstart', (e) => {
          e.preventDefault()
          moving = true
        })
      }
    }
    refreshLayout()
    innerEl.innerHTML = compiled.html
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
    .inner > * {
      pointer-events: none;
    }
    .outlined:after {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      content: '';
      outline: ${
        border || hovering
          ? `2px dashed ${
              $preferences.darkMode
                ? 'rgba(255, 255, 255, 0.5)'
                : 'rgba(10, 10, 10, 0.4)'
            }`
          : 'none'
      };
      outline-offset: -2px;
    }`

    innerEl.classList.toggle('outlined', true)
    innerEl.classList.toggle('inner', true)
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
        element.style.willChange = `transform`
        innerEl.style.willChange = `transform`
        element.style.transform = `scale(${scale})`
      }
    }
  }

  export const saveImage = () => {
    if (!containerEl) return
    innerEl?.classList.toggle('outlined', false)
    toPng(containerEl, { skipFonts: true })
      .then((dataUrl) => {
        var dl = document.createElement('a')
        document.body.appendChild(dl)
        dl.setAttribute('href', dataUrl)
        dl.setAttribute('download', `template-${+new Date()}.png`)
        dl.click()
      })
      .finally(() => {
        innerEl?.classList.toggle('outlined', true)
      })
  }

  let moving = false
  export let dragPos = { x: 0, y: 0 }

  let previousTouch: { x: number; y: number } | null

  const mousemove = (e: MouseEvent) => {
    // dragPos.x += e.movementX
    // dragPos.y += e.movementY
    const touch = {
      x: e.offsetX,
      y: e.offsetY,
    }
    const el = e.target as HTMLElement
    if (el == element) {
      if (previousTouch && moving) {
        dragPos.x += touch.x - previousTouch.x
        dragPos.y += touch.y - previousTouch.y
      }
      previousTouch = touch
    } else {
      previousTouch = null
    }
  }

  const touchmove = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    if (previousTouch && moving) {
      dragPos.x += touch.pageX - previousTouch.x
      dragPos.y += touch.pageY - previousTouch.y
    }
    previousTouch = { x: touch.pageX, y: touch.pageY }
  }

  $: if (innerEl && containerEl) {
    // containerEl.style.background = `white`
    // containerEl.style.transform = `translate(${dragPos.x / scaleFactor}px, ${
    //   dragPos.y / scaleFactor
    // }px)`
    innerEl.style.transform = `scale(${scaleFactor}) translate(${
      dragPos.x / scaleFactor
    }px, ${dragPos.y / scaleFactor}px) rotate(${rotation}deg)`
  }
</script>

<svelte:window
  on:resize|passive={scaleLayout}
  on:touchmove|passive={touchmove}
  on:mousemove|passive={mousemove}
  on:mouseup={() => {
    previousTouch = null
    moving = false
  }}
  on:touchend={() => {
    previousTouch = null
    moving = false
  }}
/>

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
