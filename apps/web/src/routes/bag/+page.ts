import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  const gatewaysKeys = await trpc(fetch).query(
    'stores:payment:gatewaysPublicCredentials',
    store?.id || ''
  )
  return { title: 'Bag', gatewaysKeys }
}
