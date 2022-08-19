import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ parent, url }) => {
  const { notFound } = await parent()
  if (notFound) {
    throw error(404, `Not found: ${url.pathname}`)
  }
  return {}
}
