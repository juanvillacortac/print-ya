import { get } from '$lib/api'
import type { LoadInput } from '@sveltejs/kit'

export type LayoutType = 'app' | 'store'

export const getLayoutType = ({ url }: LoadInput): LayoutType => {
  if (url.searchParams.get('store')) return 'store'
  return 'app'
}

export const getLayoutData = async (
  layout: LayoutType,
  { url, fetch }: LoadInput
): Promise<{ response?: any; notFound?: boolean }> => {
  switch (layout) {
    case 'store':
      try {
        let response = await get(
          `/api/stores/${url.searchParams.get('store')}`,
          {
            fetch,
          }
        )
        console.log(response)
        if (!response?.store) {
          return {
            notFound: true,
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
