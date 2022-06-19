import {
  ErrorHandler,
  getProductsByStore,
  upsertProduct,
  getStoreBySlugOrHost,
  getUserDetails,
} from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = async ({ params }) => {
  const store = await getStoreBySlugOrHost({ slug: params.slug })
  if (!store) {
    return {
      status: 404,
      body: [],
    }
  }

  try {
    const products = await getProductsByStore({ storeId: store.id })
    return {
      body: products,
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}

export const post: RequestHandler = async (event) => {
  const data = await event.request.json()
  const { userId } = await getUserDetails(event)
  try {
    const category = await upsertProduct(
      {
        ...data,
      },
      userId
    )
    return {
      body: category,
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}
