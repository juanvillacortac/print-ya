import { error } from '@sveltejs/kit'
import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const {
    layoutData: { store },
  } = await parent()

  const items = await trpc(fetch).query('shopify:list', {
    storeId: store?.id || '',
    filter: {
      id: params.importId,
    },
  })

  if (
    !items.count ||
    !(
      items.imports[0].status === 'pending' ||
      items.imports[0].status === 'in_review'
    )
  ) {
    throw error(404)
  }
  return {
    title: `Import #${items.imports[0].id}`,
  }
}
