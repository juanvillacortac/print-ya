import { prisma } from './common'
import type {
  Product as _Product,
  Store as _Store,
  StoreCategory,
} from '@prisma/client'

export type Product = _Product & {
  storeCategory?: StoreCategory
}

export const getProductBySlug = ({
  slug,
  storeId,
}: {
  slug: string
  storeId: string
}): Promise<Product> =>
  prisma.product.findFirst({
    where: {
      slug,
      storeId,
    },
    include: {
      storeCategory: true,
    },
  })

export const getProductsByStore = ({
  storeId,
}: {
  storeId: string
}): Promise<Product[]> =>
  prisma.product.findMany({
    where: {
      storeId,
    },
    include: {
      storeCategory: true,
    },
  })

export const upsertProduct = async (product: Product): Promise<Product> => {
  let c: Product
  if (product.id) {
    c = await getProductBySlug({ slug: product.slug, storeId: product.storeId })
    if (!c && !product.id) {
      throw new Error('not allowed')
    }
    return await prisma.product.update({
      where: {
        id: c?.id,
      },
      data: {
        name: product.name,
        price: product.price,
        designImage: product.designImage,
        public: product.public,
        storeCategory: {
          connect: {
            id: product.storeCategoryId,
          },
        },
        template: product.template,
        templateDraft: product.templateDraft,
      },
    })
  }
  return await prisma.product.create({
    data: {
      name: product.name,
      price: product.price,
      designImage: product.designImage,
      public: product.public,
      store: {
        connect: {
          id: product.storeId,
        },
      },
      storeCategory: {
        connect: {
          id: product.storeCategoryId,
        },
      },
      template: product.template,
      templateDraft: product.templateDraft,
      isTemplate: product.isTemplate,
      slug: product.slug,
    },
  })
}
