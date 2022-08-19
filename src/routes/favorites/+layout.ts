import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ parent }) => {
  const { notFound } = await parent()
  if (notFound) {
    throw error(404)
  }
  return {
    title: 'Favorites',
  }
}
