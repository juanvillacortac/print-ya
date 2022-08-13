<script context="module" lang="ts">
  import {
    fetchLayoutData,
    validateLayoutRoute,
    type LayoutType,
  } from '$lib/utils/layout'
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async (input) => {
    const isRouteValid = validateLayoutRoute(input)
    const { session, params, fetch } = input
    const store = await trpc(fetch).query('stores:getBySlug', params.slug)
    if (!store || store.userId !== session?.userId) {
      return {
        status: 404,
      }
    }
    const redis = new Redis({
      url: PUBLIC_UPSTASH_REDIS_URL,
      token: PUBLIC_UPSTASH_REDIS_TOKEN,
    })
    const storeData = (
      await redis.get<{ json: StoreData }>(`layout:${store.id}`)
    )?.json || {
      theme: {
        primary: '#000',
      },
    }

    if (!isRouteValid) {
      return {
        status: 404,
        stuff: {
          store,
          storeData,
        },
      }
    }
    return {
      stuff: {
        store,
        storeData,
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

  import { preferences, redisWritable } from '$lib'
  import { browser } from '$app/env'
  import Toast from '$lib/components/Toast.svelte'
  import { onDestroy, setContext } from 'svelte'
  import trpc from '$lib/trpc/client'
  import DecalshutLayout from '$lib/__layouts/DecalshutLayout.svelte'
  import { writable } from 'svelte/store'
  import { tooltip } from '$lib/components/tooltip'
  import { ColorPalette24 } from 'carbon-icons-svelte'
  import { Redis } from '@upstash/redis'
  import {
    PUBLIC_UPSTASH_REDIS_TOKEN,
    PUBLIC_UPSTASH_REDIS_URL,
  } from '$env/static/public'

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

  const layoutStore = redisWritable(
    $page.stuff.storeData,
    `layout:${$page.stuff.store?.id || '404'}`
  )

  setContext('customizable', true)
  setContext('layout-store', layoutStore)
  // #7F1D1D
</script>

<svelte:head>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

{#if $page.stuff.store}
  <DecalshutLayout store={$page.stuff.store}>
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
