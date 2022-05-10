import { prisma, slugify } from './common'
import type {
  Product as _Product,
  ProductModifier as _ProductModifier,
  ProductModifierItem,
  Store as _Store,
  StoreCategory,
} from '@prisma/client'
import type { TemplateSource } from '$lib/compiler'

export type ProductModifier = _ProductModifier & {
  items?: ProductModifierItem[]
}

export type Product = _Product & {
  storeCategory?: StoreCategory
  modifiers?: ProductModifier[]
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
      modifiers: {
        where: {
          active: true,
        },
        include: {
          items: {
            where: {
              active: true,
            },
          },
        },
      },
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
      minQuantity: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

export const upsertProduct = async (
  product: Partial<Product>
): Promise<Product> => {
  console.log(product)
  let c: Product
  console.log(
    product.modifiers.map((m) => m.items).reduce((a, b) => [...a, ...b], []),
    []
  )
  if (product.id) {
    c = await getProductBySlug({ slug: product.slug, storeId: product.storeId })
    if (!c && !product.id) {
      throw new Error('not allowed')
    }
    const updated = await prisma.product.update({
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
    const transactions = product.modifiers.map((m) =>
      prisma.productModifier.upsert({
        include: {
          items: {
            where: {
              active: true,
            },
          },
        },
        create: {
          name: m.name,
          id: undefined,
          product: {
            connect: {
              id: product.id,
            },
          },
          type: m.type,
          items: {
            create: m.items?.map((i) => ({
              name: i.name,
              cost: i.cost,
              percentage: i.percentage,
            })),
          },
        },
        update: {
          name: m.name,
          type: m.type,
          active: m.active,
          items: {
            create: m.items
              ?.filter((i) => !i.id)
              .map((i) => ({
                name: i.name,
                cost: i.cost,
                percentage: i.percentage,
              })),
          },
        },
        where: {
          id: m.id,
        },
      })
    )
    const itemsTransactions = product.modifiers
      .map((m) => m.items.filter((i) => i.id))
      .reduce((a, b) => [...a, ...b], [])
      .map((i) =>
        prisma.productModifierItem.update({
          where: {
            id: i.id,
          },
          data: {
            active: i.active,
            name: i.name,
            cost: i.cost,
            percentage: i.percentage,
          },
        })
      )

    const _modifiers = await prisma.$transaction(transactions)
    const _items = await prisma.$transaction(itemsTransactions)
    const final = await getProductBySlug({
      storeId: product.storeId,
      slug: product.slug,
    })
    return {
      ...final,
    }
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
      modifiers: {
        create: product.modifiers
          .filter((m) => m.active)
          .map((m) => ({
            name: m.name,
            type: m.type,
            items: {
              create: m.items.map((i) => ({
                name: i.name,
                cost: i.cost,
                percentage: i.percentage,
              })),
            },
          })),
      },
      slug,
    },
  })
}
