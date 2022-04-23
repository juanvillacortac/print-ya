<script lang="ts">
  import { onMount } from 'svelte'
  import { toPng } from 'html-to-image'
  import { preferences } from '$lib'

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
      document.head.append(shadowDomCssImports)
    }
  }

  export let border = false

  $: if (html != null && shadow) {
    if (containerEl) shadow.removeChild(containerEl)
    containerEl = document.createElement('div')
    containerEl.style.position = 'absolute'
    containerEl.style.outline = border
      ? `1px dashed ${$preferences.darkMode ? 'white' : 'gray'}`
      : 'none'
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

<div bind:this={element} class="p-px relative" />
