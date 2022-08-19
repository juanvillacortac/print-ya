import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'
import { Redis } from '@upstash/redis'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  const redis = new Redis({
    url: PUBLIC_UPSTASH_REDIS_URL,
    token: PUBLIC_UPSTASH_REDIS_TOKEN,
  })

  const content =
    (await redis.get<{ json: string }>(`storeFaq:${store?.id || ''}`))?.json ||
    ''

  return {
    content,
    title: 'FAQ',
  }
}
