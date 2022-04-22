<script lang="ts">
  import { onMount } from 'svelte'
  import { toPng } from 'html-to-image'

  let element: HTMLDivElement
  let shadow: ShadowRoot

  let styleEl: HTMLStyleElement
  let containerEl: HTMLDivElement

  export let html = ''
  export let css = ''

  let shadowDomCssImports: HTMLStyleElement

  onMount(() => {
    shadow = element.attachShadow({ mode: 'open' })
  })

  $: if (css != null && shadow) {
    if (styleEl) shadow.removeChild(styleEl)
    styleEl = document.createElement('style')
    styleEl.innerHTML = css
    shadow.appendChild(styleEl)

    const imports = css.match(/@import\ url\((.*?)\);/gim)

    if (shadowDomCssImports) document.head.removeChild(shadowDomCssImports)
    if (imports?.length) {
      shadowDomCssImports = document.createElement('style')
      shadowDomCssImports.innerHTML = imports.join('\n')
      document.head.append(shadowDomCssImports)
    }
  }

  $: if (html != null && shadow) {
    if (containerEl) shadow.removeChild(containerEl)
    containerEl = document.createElement('div')
    containerEl.style.position = 'absolute'
    containerEl.style.padding = '1rem'
    containerEl.innerHTML = html
    shadow.appendChild(containerEl)
  }

  export const saveImage = () => {
    if (!containerEl) return
    toPng(containerEl, { skipFonts: true }).then((dataUrl) => {
      var dl = document.createElement('a')
      document.body.appendChild(dl)
      dl.setAttribute('href', dataUrl)
      dl.setAttribute('download', `template-${+new Date()}.png`)
      dl.click()
    })
  }
</script>

<div bind:this={element} class="relative" />
