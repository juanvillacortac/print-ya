import { ErrorHandler, getProductBySlug, getStoreBySlugOrHost } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = async ({ params }) => {
  const store = await getStoreBySlugOrHost({ slug: params.slug })
  if (!store) {
    return {
      status: 404,
    }
  }

  const slug = params.productSlug
  try {
    const product = await getProductBySlug({ slug, storeId: store.id })
    return {
      body: product,
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}
