import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'
import trpc from '$lib/trpc/client'
import { error } from '@sveltejs/kit'
import { Redis } from '@upstash/redis'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad.customization = async ({
  url,
  fetch,
  params,
}) => {
  const { fullHost, host, userAgent, layoutType } = await trpc(fetch).query(
    'utils:kit-locals'
  )
  const user = await trpc(fetch).query('user:whoami')

  const store = await trpc(fetch).query('stores:getBySlug', params.slug || '')
  if (!store || store.userId !== user?.id) {
    throw error(404)
  }
  const redis = new Redis({
    url: PUBLIC_UPSTASH_REDIS_URL,
    token: PUBLIC_UPSTASH_REDIS_TOKEN,
  })
  // const storeData = (
  //   await redis.get<{ json: StoreData }>(`storeData:${store.id}`)
  // )?.json

  return {
    fullHost,
    host,
    userAgent,
    user,
    layoutData: {
      layout: layoutType,
      store,
      // storeData,
    },
  }
}
