import { ErrorHandler, upsertStoreCategory } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const post: RequestHandler = async (event) => {
  const data = await event.request.json()
  try {
    const category = await upsertStoreCategory(data)
    return {
      body: category,
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}

export const get: RequestHandler = () => {
  return {
    status: 200,
  }
}
