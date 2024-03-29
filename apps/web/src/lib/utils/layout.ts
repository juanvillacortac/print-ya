import trpc from '$lib/trpc/client'
import type { LayoutType } from '@shackcart/db'
import type { LoadEvent } from '@sveltejs/kit'
import type { LayoutData } from '@shackcart/db'
import { isCanonical } from './host'
import type { SvelteComponent } from 'svelte'

export function getLayoutType<T extends { url: URL }>({ url }: T): LayoutType {
  // if (url.searchParams.get('store')) return 'store'
  if (!isCanonical(url.host)) {
    return 'store'
  }
  return 'app'
}

export const storeRoutes = [
  '/products',
  '/bag',
  '/favorites',
  '/contact',
  '/faq',
  '/account',
]
export const appRoutes = ['/stores', '/settings', '/app']

export function validateLayoutRoute<T extends { url: URL }>(
  event: T,
  layoutType?: LayoutType
) {
  switch (layoutType || getLayoutType(event)) {
    case 'store':
      return !Boolean(
        appRoutes.find((url) => event.url.pathname.startsWith(url))
      )
    case 'app':
      return !Boolean(
        storeRoutes.find((url) => event.url.pathname.startsWith(url))
      )
  }
}

export async function fetchLayoutData<
  T extends Pick<LoadEvent, 'url' | 'fetch' | 'params'>
>(
  { url, fetch, params }: T,
  layoutType: LayoutType
): Promise<{ layoutData: LayoutData; notFound?: boolean }> {
  let layoutData: LayoutData = {
    layout: layoutType,
  }
  let isRouteValid = validateLayoutRoute({ url })

  switch (layoutData.layout) {
    case 'store':
      try {
        layoutData = {
          ...layoutData,
          ...(await trpc(fetch).query('stores:getByHost', url.host)),
        }
        if (!layoutData.store) {
          let slug = url.searchParams.get('store')
          if (!slug && url.host) {
            slug = url.host.split('.')[0]
          }
          if (slug) {
            layoutData = {
              ...layoutData,
              ...(await trpc(fetch).query('stores:getBySlug', slug)),
            }
          }
        }
        return {
          notFound: !layoutData.store || !isRouteValid,
          layoutData,
        }
      } catch (err) {
        console.log(err)
      }
    default:
      // if (params.slug) {
      //   const { store, storeData } = await client.query(
      //     'stores:getBySlug',
      //     params.slug
      //   )
      //   const user = await client.query('user:whoami')
      //   if (store && store.userId === user?.id) {
      //     layoutData.store = store
      //     layoutData.storeData = storeData
      //   } else {
      //     isRouteValid = false
      //   }
      // }
      // return {
      //   notFound: !isRouteValid,
      //   layoutData,
      // }
      return {
        notFound: !isRouteValid,
        layoutData,
      }
  }
}

export async function getSvelteLayoutComponent(layoutData: LayoutData) {
  let layoutComponent: new () => SvelteComponent
  switch (layoutData?.layout || 'app') {
    case 'app':
      // @ts-ignore
      layoutComponent = (await import('$lib/__layouts/AppLayout.svelte'))
        .default as any
      break
    default:
      if (!layoutData.store) {
        // @ts-ignore
        layoutComponent = (await import('$lib/__layouts/AppLayout.svelte'))
          .default as any
      } else {
        layoutComponent = // @ts-ignore
          (await import('$lib/__layouts/DecalshutLayout.svelte')).default as any
      }
      break
  }
  return layoutComponent
}
