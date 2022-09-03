import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { product } = await parent()
  return {
    title: product.name,
    backLink: product.archived
      ? '../deleted-products'
      : product.shopifyImportId
      ? `import/${product.shopifyImportId}`
      : undefined,
  }
}
