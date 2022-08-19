<script lang="ts">
  import 'virtual:windi.css'
  import '$lib/styles/base.css'
  import '$lib/styles/components.css'

  import '$lib/__storefront/web-components'

  import NProgress from 'nprogress'
  import { navigating, page } from '$app/stores'

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

  import { createLayoutStore, layoutData, preferences } from '$lib'
  import { browser } from '$app/env'
  import Toast from '$lib/components/Toast.svelte'
  import { onDestroy, setContext } from 'svelte'
  import DecalshutLayout from '$lib/__layouts/DecalshutLayout.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { ColorPalette24 } from 'carbon-icons-svelte'

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

  const layoutStore = createLayoutStore({
    editable: true,
    initialState: $layoutData.storeData,
    store: $layoutData.store!,
  })
  // #5D2847
  // const layoutStore = writable({
  //   thpage.stuffeme: {
  //     primary: '#5D2847',
  //   },
  //   footer: {
  //     submit: {
  //       title: 'Stay In The Loop',
  //       text: `Become a Decals Hut Insider and get 10% off your order today. Plus we'll keep you up-to-date with the latest designs.`,
  //     },
  //     links: [
  //       {
  //         title: 'Home',
  //         href: '/',
  //       },
  //     ],
  //     appendix: {
  //       title: 'Secure Checkout',
  //       text: 'We use encrypted SSL security to ensure that your credit card information is 100% protected.',
  //       img: 'https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/ff-checkout-single.png?v=151997186021135005011631037864',
  //     },
  //   },
  // })

  setContext('customizable', true)
  setContext('layout-store', layoutStore)
  // #7F1D1D
</script>

<svelte:head>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

{#if $layoutData.store}
  <DecalshutLayout>
    <slot />
  </DecalshutLayout>
  <div class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center">
    <button
      class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 relative hover:scale-95"
      title="Change primary color"
      on:click={() => document.getElementById(`color-palette`)?.click()}
      use:tooltip
    >
      <input
        id="color-palette"
        type="color"
        bind:value={$layoutStore.theme.primary}
        class="h-0 opacity-0 w-0 overflow-hidden absolute"
      />
      <ColorPalette24 />
    </button>
  </div>
{/if}
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
