import trpc from '$lib/trpc/client'
import { fetchLayoutData, getSvelteLayoutComponent } from '$lib/utils/layout'
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
  const layoutComponent = await getSvelteLayoutComponent(layoutData)

  let mockups: Record<'path' | 'url', string>[] = []
  if (layoutData.store) {
    mockups = await trpc(fetch).query(
      'stores:sharedData:getMockups',
      layoutData.store.id
    )
  }

  return {
    fullHost,
    host,
    userAgent,
    user,
    notFound,
    layoutData,
    layoutComponent,
    mockups,
  }
}

export const prerender = false
