import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, url }) => {
  const { product } = await parent()
  return {
    title: product.name,
    backLink:
      url.searchParams.get('from') == 'group'
        ? `groups/${product.productsGroupId}`
        : product.archived
        ? '../deleted-products'
        : product.shopifyImportId
        ? `import/${product.shopifyImportId}`
        : undefined,
  }
}
