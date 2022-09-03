import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, fetch }) => {
  return {
    title: 'Deleted products',
    backLink: 'products',
  }
}
