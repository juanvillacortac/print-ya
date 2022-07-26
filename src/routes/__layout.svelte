<script context="module" lang="ts">
  import {
    fetchLayoutData,
    validateLayoutRoute,
    type LayoutType,
  } from '$lib/utils/layout'
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async (input) => {
    const isRouteValid = validateLayoutRoute(input)
    const { notFound, response: stuff } = await fetchLayoutData(input)

    let layout: any
    switch (input.session.layout) {
      case 'app':
        layout = (await import('$lib/__layouts/AppLayout.svelte')).default
        break
      case 'store':
        if (!stuff?.store) {
          layout = (await import('$lib/__layouts/AppLayout.svelte')).default
        } else {
          layout = (await import('$lib/__layouts/DecalshutLayout.svelte'))
            .default
        }
        break
    }

    if (notFound || !isRouteValid) {
      return {
        status: 404,
        stuff,
        props: {
          layout,
        },
      }
    }
    return {
      stuff,
      props: {
        layout,
      },
    }
  }
</script>

<script lang="ts">
  import 'virtual:windi.css'
  import '$lib/styles/base.css'
  import '$lib/styles/components.css'

  import '$lib/__storefront/web-components'

  import NProgress from 'nprogress'
  import { navigating, page, session } from '$app/stores'

  // NProgress css
  import '$lib/styles/__nprogress.css'

  NProgress.configure({
    minimum: 0.16,
    showSpinner: false,
  })

  $: {
    if ($navigating && $navigating.from.pathname !== $navigating.to.pathname) {
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
  import { browser } from '$app/env'
  import Toast from '$lib/components/Toast.svelte'
  import { onDestroy } from 'svelte'

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

  export let layout: any
  const layoutProps: Record<LayoutType, () => any> = {
    app: () => ({}),
    store: () => ({
      store: $page.stuff.store,
    }),
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

<svelte:component this={layout} {...layoutProps[$session.layout]()}>
  <slot />
</svelte:component>
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
