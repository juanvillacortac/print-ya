import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'
import { Redis } from '@upstash/redis'
import type { LoadEvent } from '@sveltejs/kit'
import { validateLayoutRoute, type LayoutData, type LayoutType } from './layout'
import { getStore } from '$lib/db'

export async function fetchLayoutData<T extends Pick<LoadEvent, 'url'>>(
  { url }: T,
  layoutType: LayoutType
): Promise<{ layoutData: LayoutData; notFound?: boolean }> {
  let layoutData: LayoutData = {
    layout: layoutType,
  }
  const isRouteValid = validateLayoutRoute({ url })
  if (!isRouteValid)
    return {
      notFound: true,
      layoutData,
    }

  switch (layoutData.layout) {
    case 'store':
      try {
        layoutData.store = await getStore({ host: url.host })
        if (!layoutData.store) {
          let slug = url.searchParams.get('store')
          if (!slug && url.host) {
            slug = url.host.split('.')[0]
          }
          if (slug) {
            layoutData.store = await getStore({ slug })
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
          notFound: !layoutData.store,
          layoutData,
        }
      } catch (err) {
        console.log(err)
      }
    default:
      return {
        layoutData,
      }
  }
}
