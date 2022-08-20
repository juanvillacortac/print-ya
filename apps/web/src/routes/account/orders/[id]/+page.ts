import { error } from '@sveltejs/kit'
import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params, parent, url }) => {
  const {
    layoutData: { store },
  } = await parent()
  const order = await trpc(fetch).query('orders:get', {
    orderId: params.id,
    token: url.searchParams.get('token') || undefined,
  })
  const customer = await trpc(fetch).query('customer:whoami')
  if (
    !order ||
    order.storeId != store?.id ||
    (customer && order.customerId != customer.id)
  ) {
    throw error(404)
  }
  return {
    order,
    guest: Boolean(order.token),
    title: `Order #${order.id}`,
  }
}
