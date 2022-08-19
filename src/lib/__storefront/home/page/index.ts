import type { Store } from '$lib/db'
import trpc from '$lib/trpc/client'
import type { LoadEvent } from '@sveltejs/kit'

export const getPageData = async ({
  fetch,
  store,
}: {
  fetch: LoadEvent['fetch']
  store: Store
}) => {
  const data = await trpc(fetch).query('products:list', {
    storeSlug: store.slug || '',
    page: 1,
    pageSize: 4,
  })
  return {
    products: data.products.filter((p) => p.public) || [],
  }
}

export { default as Page } from './Page.svelte'
