import { get } from '$lib/api'
import type { LoadInput } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit/types/private'

export type LayoutType = 'app' | 'store'

export const getLayoutType = ({
  url,
}: LoadInput | RequestEvent): LayoutType => {
  if (url.searchParams.get('store')) return 'store'
  return 'app'
}

const storeRoutes = ['/products']

const appRoutes = ['/app', '/login']

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

export const getLayoutData = async ({
  url,
  fetch,
  session,
}: LoadInput): Promise<{ response?: any; notFound?: boolean }> => {
  switch (session.layout) {
    case 'store':
      try {
        let response = await get(
          `/api/stores/${url.searchParams.get('store')}`,
          {
            fetch,
          }
        )
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
