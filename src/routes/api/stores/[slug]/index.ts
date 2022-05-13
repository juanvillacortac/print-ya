import * as db from '$lib/db'
import { ErrorHandler } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = async (event) => {
  const { slug } = event.params
  const customDomain = Boolean(event.url.searchParams.get('customDomain'))
  try {
    const store = await db.getStoreBySlugOrHost({
      slug: customDomain ? undefined : slug,
      host: customDomain ? slug : undefined,
    })
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
