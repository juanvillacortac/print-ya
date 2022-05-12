import { get } from '$lib/api'
import type { LoadInput } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit/types/private'
import { isCanonical } from './host'

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

const storeRoutes = ['/products']

const appRoutes = ['/app', '/login']

export const validateLayoutRoute = (event: LoadInput | RequestEvent) => {
  const layout = getLayoutType(event)
  console.log('validation', event.url)
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

export const getLayoutData = async ({
  url,
  fetch,
  session,
}: LoadInput): Promise<{ response?: any; notFound?: boolean }> => {
  switch (session.layout) {
    case 'store':
      try {
        let slug = url.searchParams.get('store')
        if (!slug) {
          slug = session.host.split('.')[0]
        }
        console.log(slug)
        let response = await get(`/api/stores/${slug}`, {
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
