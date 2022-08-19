import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { product } = await parent()
  return {
    title: product.name,
  }
}
