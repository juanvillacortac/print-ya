import { error } from '@sveltejs/kit'
import type { LayoutLoad } from './$types'
import trpc from '$lib/trpc/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    const product = await trpc(fetch).query('products:getBySlug', {
      productSlug: params.productSlug || '',
      storeSlug: params.slug || '',
    })
    if (!product) throw error(404)
    return {
      product,
    }
  } catch (err) {
    console.log(err)
    throw error(404)
  }
}
