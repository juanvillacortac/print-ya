import trpc from '$lib/trpc/client'
import type { RequestEvent, LoadEvent } from '@sveltejs/kit'
import { isCanonical } from './host'
import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'
import { Redis } from '@upstash/redis'

export type LayoutType = 'app' | 'store'

export const getLayoutType = ({
  url,
}: LoadEvent | RequestEvent): LayoutType => {
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

export const validateLayoutRoute = (event: LoadEvent | RequestEvent) => {
  const layout = getLayoutType(event)
  switch (layout) {
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

export type LayoutData = Partial<{
  layout: import('$lib/utils/layout').LayoutType
  storeData?: StoreData
  store?: import('$lib/db').Store | null
  product?: import('$lib/db').Product | null
  products?: import('$lib/db').StripedProduct[] | null
}>

export const fetchLayoutData = async ({
  url,
  fetch,
  session,
}: LoadEvent): Promise<{ response?: LayoutData; notFound?: boolean }> => {
  const client = trpc(fetch)
  let response: LayoutData = {
    layout: session.layout,
  }
  switch (session.layout) {
    case 'store':
      try {
        response.store = await client.query('stores:getByHost', url.host)
        if (!response.store) {
          let slug = url.searchParams.get('store')
          if (!slug && session.host) {
            slug = session.host.split('.')[0]
          }
          if (slug) {
            response.store = await client.query('stores:getBySlug', slug)
          }
        }
        if (response.store) {
          const redis = new Redis({
            url: PUBLIC_UPSTASH_REDIS_URL,
            token: PUBLIC_UPSTASH_REDIS_TOKEN,
          })
          response.storeData = (
            await redis.get<{ json: StoreData }>(
              `layout-v2:${response.store.id}`
            )
          )?.json || {
            theme: {
              primary: '#5D2847',
            },
            footer: {
              submit: {
                title: 'Stay In The Loop',
                text: `Become a Decals Hut Insider and get 10% off your order today. Plus we'll keep you up-to-date with the latest designs.`,
              },
              links: [
                {
                  title: 'Home',
                  href: '/',
                },
              ],
              appendix: {
                title: 'Secure Checkout',
                text: 'We use encrypted SSL security to ensure that your credit card information is 100% protected.',
                img: 'https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/ff-checkout-single.png?v=151997186021135005011631037864',
              },
            },
          }
        }
        console.log(response)
        return {
          notFound: !response.store,
          response,
        }
      } catch (err) {
        console.log(err)
      }
    default:
      return {
        response: {},
      }
  }
}
