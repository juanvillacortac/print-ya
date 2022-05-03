import { prisma, slugify } from './common'
import type {
  Product as _Product,
  Store as _Store,
  StoreCategory,
} from '@prisma/client'
import type { TemplateSource } from '$lib/compiler'

export type Product = _Product & {
  storeCategory?: StoreCategory
}

export type StripedProduct = Omit<_Product, 'templateDraft'> & {
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

export const getProductsByStore = async ({
  storeId,
  published,
}: {
  storeId: string
  published?: boolean
}): Promise<StripedProduct[]> =>
  prisma.product.findMany({
    where: {
      storeId,
      public: published,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      designImage: true,
      isTemplate: true,
      price: true,
      public: true,
      slug: true,
      description: true,
      store: true,
      storeCategory: true,
      storeCategoryId: true,
      storeId: true,
      updatedAt: true,
      template: true,
    },
  })

export const upsertProduct = async (
  product: Partial<Product>
): Promise<Product> => {
  console.log(product)
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
        description: product.description,
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
  let slug = slugify(product.name)
  const coincidences = await prisma.product.findMany({
    where: {
      slug: {
        startsWith: slug,
      },
      storeId: product.storeId,
    },
  })
  console.log(slug)
  if (coincidences.length) {
    slug = `${slug}-${coincidences.length}`
  }

  const defaultTemplate: TemplateSource = {
    html: `<div class="flex h-full w-full items-center justify-center">
    <h1
      class="font-black border-4 border-red-500 rounded-2xl text-center leading-none p-2 pb-2.5 text-red-500 text-4xl uppercase"
    >
      Change me!
    </h1>
  </div>
  `,
    css: '',
    fields: '',
    sizeUnit: 'cm',
    width: 8,
    height: 8,
    windi: true,
    name: product.name,
  }

  return await prisma.product.create({
    data: {
      name: product.name,
      price: product.price,
      designImage: product.designImage,
      public: product.public,
      description: product.description,
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
      template: JSON.stringify(defaultTemplate),
      templateDraft: JSON.stringify(defaultTemplate),
      isTemplate: product.isTemplate,
      slug,
    },
  })
}
