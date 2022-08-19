import trpc from '$lib/trpc/client'
import type { RequestEvent, LoadEvent } from '@sveltejs/kit'
import { isCanonical } from './host'
import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'
import { Redis } from '@upstash/redis'

export type LayoutType = 'app' | 'store'

export function getLayoutType<T extends { url: URL }>({ url }: T): LayoutType {
  if (url.searchParams.get('store')) return 'store'
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

export type LayoutData = {
  layout: LayoutType
  store?: import('$lib/db').Store | null
  storeData?: StoreData
}

export async function fetchLayoutData<
  T extends Pick<LoadEvent, 'url' | 'fetch'>
>(
  { url, fetch }: T,
  layoutType: LayoutType
): Promise<{ layoutData: LayoutData; notFound?: boolean }> {
  const client = trpc(fetch)
  let layoutData: LayoutData = {
    layout: layoutType,
  }
  const isRouteValid = validateLayoutRoute({ url })

  switch (layoutData.layout) {
    case 'store':
      try {
        layoutData.store = await client.query('stores:getByHost', url.host)
        if (!layoutData.store) {
          let slug = url.searchParams.get('store')
          if (!slug && url.host) {
            slug = url.host.split('.')[0]
          }
          if (slug) {
            layoutData.store = await client.query('stores:getBySlug', slug)
          }
        }
        if (layoutData.store) {
          const redis = new Redis({
            url: PUBLIC_UPSTASH_REDIS_URL,
            token: PUBLIC_UPSTASH_REDIS_TOKEN,
          })
          layoutData.storeData = (
            await redis.get<{ json: StoreData }>(
              `storeData:${layoutData.store.id}`
            )
          )?.json
        }
        return {
          notFound: !layoutData.store || !isRouteValid,
          layoutData,
        }
      } catch (err) {
        console.log(err)
      }
    default:
      return {
        notFound: !isRouteValid,
        layoutData,
      }
  }
}
