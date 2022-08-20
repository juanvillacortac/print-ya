import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import trpc from '$lib/trpc/client'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const {
    layoutData: { store },
  } = await parent()

  const product = await trpc(fetch).query('products:getBySlug', {
    storeSlug: store?.slug || '',
    productSlug: params.productSlug,
  })

  // const data = await get(
  //   `/api/stores/${store?.slug}/products/${params.productSlug}`,
  //   { fetch }
  // )
  if (!product || !product.public) throw error(404)
  return {
    product,
    title: product.name,
  }
}
