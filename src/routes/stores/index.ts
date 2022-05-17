import * as db from '$lib/db'
import { ErrorHandler } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = async (event) => {
  const { userId } = await db.getUserDetails(event)
  try {
    const stores = await db.getUserStores({ userId })
    return {
      body: {
        stores,
      },
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}
