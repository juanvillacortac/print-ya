import { error } from '@sveltejs/kit'
import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
  const store = await trpc(fetch).query('stores:getBySlug', params.slug)
  if (!store) {
    throw error(404)
  }
  const customer = await trpc(fetch).query('customer:get', params.id)
  if (!customer || customer.storeId != store.id) {
    throw error(404)
  }
  return {
    customer,
    title: `Customer: ${customer.firstName} ${customer.lastName}`,
  }
}
