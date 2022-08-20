import type { PageLoad } from './$types'
import { getPageData } from '$lib/__storefront/home/page'

export const load: PageLoad = async ({ fetch, parent }) => {
  const {
    layoutData: { layout, store },
  } = await parent()
  if (layout === 'store' && store) {
    return await getPageData({ fetch, store })
  }
  return {
    title: 'Dashboard',
  }
}
