import { error, redirect } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import trpc from '$lib/trpc/client'

export const load: LayoutLoad = async ({ fetch, url, parent }) => {
  const { notFound } = await parent()
  if (notFound) {
    throw error(404)
  }
  const customer = await trpc(fetch).query('customer:whoami')
  if (
    url.pathname.startsWith('/account/orders/') &&
    url.pathname != '/account/orders/' &&
    url.searchParams.get('token')
  )
    return {}
  if (!customer) {
    throw redirect(
      302,
      `/login?callbackUrl=${encodeURIComponent(url.pathname)}`
    )
  }
  return {}
}
