import trpc from '$lib/trpc/client'
import { fetchLayoutData } from '$lib/utils/layout'
import type { SvelteComponent } from 'svelte/internal'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ url, fetch, params }) => {
  const { fullHost, host, userAgent, layoutType } = (await (
    await fetch('/api/kit-locals')
  ).json()) as App.Locals

  const { notFound, layoutData } = await fetchLayoutData(
    { url, fetch, params },
    layoutType
  )
  const user = await trpc(fetch).query('user:whoami')
  let layoutComponent: new () => SvelteComponent

  switch (layoutData?.layout || 'app') {
    case 'app':
      layoutComponent = (await import('$lib/__layouts/AppLayout.svelte'))
        .default as any
      break
    default:
      if (!layoutData.store) {
        layoutComponent = (await import('$lib/__layouts/AppLayout.svelte'))
          .default as any
      } else {
        layoutComponent = (
          await import('$lib/__layouts/DecalshutLayout.svelte')
        ).default as any
      }
      break
  }

  return {
    fullHost,
    host,
    userAgent,
    user,
    notFound,
    layoutData,
    layoutComponent,
  }
}

export const prerender = false
