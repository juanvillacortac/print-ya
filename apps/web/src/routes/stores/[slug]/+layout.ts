import trpc from '$lib/trpc/client'
import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ parent, url, params, fetch }) => {
  const { notFound, layoutData, user } = await parent()
  if (notFound) {
    throw error(404, `Not found: ${url.pathname}`)
  }
  const { store, storeData } = await trpc(fetch).query(
    'stores:getBySlug',
    params.slug
  )
  if (store?.userId === user?.id) {
    layoutData.store = store
    layoutData.storeData = storeData
  } else {
    throw error(404, `Not found: ${url.pathname}`)
  }

  return {}
}
