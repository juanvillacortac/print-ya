import { fetchProducts } from '$lib/__storefront/ProductsWrapper.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  const categories = store?.categories || []
  const categorySlug = url.searchParams.get('category')
  const page = url.searchParams.get('page') || ''

  const { count, products } = await fetchProducts(
    {
      storeSlug: store?.slug || '',
      search: url.searchParams.get('search') || undefined,
      page: +page || 1,
      categoryId: categorySlug
        ? categories?.find((c) => c.name === categorySlug)?.id
        : undefined,
    },
    fetch
  )
  return { count, products }
}
