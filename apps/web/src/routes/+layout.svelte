<script lang="ts">
  import 'virtual:fonts.css'
  import 'virtual:windi.css'
  import '$lib/styles/base.css'
  import '$lib/styles/components.css'

  import '$lib/__storefront/web-components'

  import NProgress from 'nprogress'
  import { navigating, page } from '$app/stores'
  import type { LayoutData } from './$types'

  // NProgress css
  import '$lib/styles/__nprogress.css'

  export let data: LayoutData

  const mockups = writable(data.mockups)
  $: $mockups = data.mockups
  setContext('global-mockups', mockups)

  NProgress.configure({
    minimum: 0.16,
    showSpinner: false,
  })

  $: {
    if (
      $navigating &&
      // $navigating.from?.url.pathname !== $navigating.to?.url.pathname &&
      data.layoutData.layout === 'store'
    ) {
      NProgress.start()
    }
    if (!$navigating) {
      NProgress.done()
    }
  }

  onDestroy(() => {
    if (!$navigating) {
      NProgress.done()
    }
  })

  import { preferences } from '$lib'
  import { browser } from '$app/environment'
  import Toast from '$lib/components/Toast.svelte'
  import { onDestroy, setContext } from 'svelte'
  import { writable } from 'svelte/store'

  $: if (browser)
    document.documentElement.classList.toggle('dark', $preferences.darkMode)

  const fontsURL =
    'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,900;1,700&family=Square+Peg&family=Roboto:wght@300;400;500;700;900&display=swap'

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
</script>

<svelte:head>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

<div data-sveltekit-prefetch>
  <svelte:component this={data.layoutComponent}>
    <slot />
  </svelte:component>
</div>

<Toast />

<style>
  :global(html) {
    --windi-bg: white;
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: #e5e7eb;
    @apply bg-white text-gray-700;
  }
  :global(html.dark) {
    --windi-bg: rgb(31, 41, 55);
    --windi-hover-bg: #f6f6f6;
    --windi-text: #1f2937;
    --windi-bc: rgb(75, 85, 99);
    @apply bg-gray-800 text-white;
  }
</style>
