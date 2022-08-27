import { error } from '@sveltejs/kit'
import trpc from '$lib/trpc/client'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const {
    layoutData: { store },
  } = await parent()

  const order = await trpc(fetch).query('orders:get', {
    orderId: params.id,
  })

  if (!order || order.storeId != store!.id) {
    throw error(404)
  }
  return {
    order,
    title: `Order #${order.id}`,
  }
}
