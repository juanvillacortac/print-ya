import { get } from '$lib/api'
import { defineService } from '$lib/context'
import type { Store } from '$lib/db'
import type { LoadInput } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit/types/private'
import { getDefaultHost, isCanonical } from './host'

export type LayoutType = 'app' | 'store'

export const getLayoutType = ({
  url,
}: LoadInput | RequestEvent): LayoutType => {
  if (url.searchParams.get('store')) return 'store'
  if (!isCanonical(url.host)) {
    return 'store'
  }
  return 'app'
}

export const storeRoutes = ['/products', '/bag', '/cart']
export const appRoutes = ['/stores', '/login', '/settings', '/app']

export const validateLayoutRoute = (event: LoadInput | RequestEvent) => {
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
  layout?: import('$lib/utils/layout').LayoutType
  store?: import('$lib/db').Store
  product?: import('$lib/db').Product
  products?: import('$lib/db').StripedProduct[]
}>

export const fetchLayoutData = async ({
  url,
  fetch,
  session,
}: LoadInput): Promise<{ response?: LayoutData; notFound?: boolean }> => {
  switch (session.layout) {
    case 'store':
      try {
        let response: any
        response = await get(`/api/stores/${url.host}?customDomain=true`, {
          fetch,
        })
        if (response?.store) {
          return {
            response,
          }
        }
        let slug = url.searchParams.get('store')
        if (!slug) {
          slug = session.host.split('.')[0]
        }
        response = await get(`/api/stores/${slug}`, {
          fetch,
        })
        if (!response?.store) {
          return {
            notFound: true,
            response: {},
          }
        }
        return {
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
