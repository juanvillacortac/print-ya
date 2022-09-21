import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import trpc from '$lib/trpc/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  const product = await trpc(fetch).query('products:getBySlug', {
    productSlug: params.productSlug || '',
    storeSlug: params.slug || '',
  })
  if (!product) throw error(404, 'Product not found')
  return {
    product,
  }
}
