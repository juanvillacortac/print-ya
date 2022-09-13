import trpc from '$lib/trpc/client'
import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ parent, fetch }) => {
  const { notFound, layoutData } = await parent()
  if (notFound) {
    throw error(404)
  }
  return {}
}
