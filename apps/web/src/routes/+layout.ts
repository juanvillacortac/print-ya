import trpc from '$lib/trpc/client'
import { fetchLayoutData } from '$lib/utils/layout'
import { api } from '@shackcart/shared'
import { redirect } from '@sveltejs/kit'
import type { SvelteComponent } from 'svelte/internal'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ url, fetch, params }) => {
  const { fullHost, host, userAgent, layoutType } = await api.get<App.Locals>(
    '/api/kit-locals',
    {
      fetch: fetch as any,
    }
  )

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
    case 'store':
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
