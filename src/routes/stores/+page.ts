import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
  const stores = await trpc(fetch).query('user:stores')
  return { stores }
}
