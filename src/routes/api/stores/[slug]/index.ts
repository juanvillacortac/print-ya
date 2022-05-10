import * as db from '$lib/db'
import { ErrorHandler } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = async (event) => {
  const { slug } = event.params
  try {
    const store = await db.getStoreBySlug({ slug })
    if (!store) {
      return {
        status: 404,
      }
    }
    return {
      body: {
        store,
      },
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}
