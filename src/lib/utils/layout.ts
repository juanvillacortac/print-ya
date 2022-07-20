import trpc from '$lib/trpc/client'
import type { RequestEvent, LoadEvent } from '@sveltejs/kit'
import { isCanonical } from './host'

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
  switch (session.layout) {
    case 'store':
      try {
        let response: LayoutData = {
          store: await client.query('stores:getByHost', url.host),
        }
        if (!response.store) {
          let slug = url.searchParams.get('store')
          if (!slug && session.host) {
            slug = session.host.split('.')[0]
          }
          if (slug) {
            response.store = await client.query('stores:getBySlug', slug)
          }
        }
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
