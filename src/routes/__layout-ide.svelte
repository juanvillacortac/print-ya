<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ params, fetch, url }) => {
    // const data = await get(`/api/stores/${params.slug}`, { fetch })
    const store = await client(fetch).query('stores:getBySlug', params.slug)
    const product = await client(fetch).query('products:getBySlug', {
      productSlug: params.productSlug,
      storeSlug: params.slug,
    })
    // const product: Product = await get(
    //   `/api/stores/${params.slug}/products/${params.productSlug}`,
    //   { fetch }
    // )
    if (!store || !product || product.type !== 'template')
      return {
        status: 404,
      }
    return {
      stuff: {
        store,
        product,
      },
    }
  }
</script>

<script lang="ts">
  import 'virtual:windi.css'
  import { browser } from '$app/env'
  import { preferences } from '$lib'
  import { page } from '$app/stores'
  import type { Product, Store } from '$lib/db'

  import NProgress from 'nprogress'
  import { navigating } from '$app/stores'

  // NProgress css
  import '$lib/styles/__nprogress.css'
  import { onDestroy } from 'svelte'
  import Toast from '$lib/components/Toast.svelte'
  import client, { invalidateQuery } from '$lib/trpc/client'

  $: path = $page.url.pathname

  NProgress.configure({
    minimum: 0.16,
    showSpinner: false,
  })

  $: {
    if ($navigating) {
      NProgress.start()
    }
    if (!$navigating) {
      NProgress.done()
    }
  }

  $: if (path && browser) {
    invalidateQuery('stores:getBySlug', 'products:getBySlug')
  }

  onDestroy(() => {
    if (!$navigating) {
      NProgress.done()
    }
  })

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

  let store = $page.stuff.store as Store
  let product = $page.stuff.product as Product

  $: pageTitle = product.name + ' | ' + 'ShackCart'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <link rel="preconnect" href="https://caravaggio-cdn.vercel.app" />
  {@html fontsTag}
</svelte:head>

<Toast />
<div class=" bg-white text-gray-700 relative  dark:bg-gray-800 dark:text-white">
  <slot />
</div>
