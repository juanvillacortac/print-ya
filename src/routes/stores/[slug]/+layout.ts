import trpc from '$lib/trpc/client'
import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ params, fetch, parent }) => {
  const { user, layoutData } = await parent()
  const store = await trpc(fetch).query('stores:getBySlug', params?.slug || '')
  if (!store || store.userId !== user?.id) {
    throw error(404)
  }
  return {
    layoutData: {
      ...layoutData,
      store,
    },
  }
}
