import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import trpc from '$lib/trpc/client'

export const load: LayoutLoad = async ({ params, fetch, parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  const group = await trpc(fetch).query('products:groups:get', params.groupId)
  if (!group || group.storeId != store?.id)
    throw error(404, 'Products group not found')
  return {
    group,
  }
}
