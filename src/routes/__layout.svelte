<script lang="ts">
  import 'virtual:windi.css'
  import '$lib/styles/base.css'

  import Favicons from '$lib/components/Favicons.svelte'
  import { height } from '$lib/components/nav/Header.svelte'
  import { preferences } from '$lib'
  import { browser } from '$app/env'

  $: if (browser)
    document.documentElement.classList.toggle('dark', $preferences.darkMode)

  const fontsURL =
    'https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400;700&family=Roboto:wght@300;400;500;700;900&display=swap'

  const fontsTag = `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="${fontsURL}""
    rel="stylesheet"
    media="print"
    onload="this.onload=null; this.removeAttribute('media');"
  />
  <noscript>
    <link rel="stylesheet" href=${fontsURL} />
  </noscript>`

  $: cssGlobals = {
    navbarHeight: `${$height}px`,
    navbarHeightNegative: `-${$height}px`,
  }
</script>

<svelte:head>
  <title>Print Ya!</title>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

<Favicons favicon="/images/logo.svg" themeColor="#000" titleName="Print Ya!" />

<slot />

<style>
  :global(html) {
    --windi-bg: white;
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: #e5e7eb;
  }
  :global(html.dark) {
    --windi-bg: rgb(31, 41, 55);
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: rgb(75, 85, 99);
  }
</style>
