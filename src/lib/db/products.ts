import { prisma, slugify } from './common'
import type {
  Prisma,
  Product as _Product,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
  Store as _Store,
  StoreCategory,
} from '@prisma/client'
import type { TemplateSource } from '$lib/compiler'
import { nanoid } from 'nanoid'

export type ProductModifierItem = Omit<_ProductModifierItem, 'ordinal'> & {
  meta: any
}

export type ProductModifier = Omit<_ProductModifier, 'ordinal'> & {
  meta?: any
  items: ProductModifierItem[]
}

export type Product<T extends TemplateSource = any> = _Product & {
  template: T
  meta?: any
  storeCategory: StoreCategory | null
  modifiers: ProductModifier[]
}

export type StripedProduct = Omit<_Product, 'templateDraft' | 'archived'> & {
  storeCategory: StoreCategory | null
}

export const getProductById = (id: string): Promise<Product | null> =>
  prisma.product
    .findUnique({
      where: {
        id,
      },
      include: {
        storeCategory: true,
        modifiers: {
          where: {
            active: true,
          },
          orderBy: {
            ordinal: 'asc',
          },
          include: {
            items: {
              where: {
                active: true,
              },
              orderBy: {
                ordinal: 'asc',
              },
            },
          },
        },
      },
    })
    .then((data: Product | null) => {
      if (data) {
        data.modifiers = data!.modifiers!.map((m) => {
          // @ts-ignore
          delete m?.ordinal
          m.items = m?.items!.map((i) => {
            // @ts-ignore
            delete i.ordinal
            return i
          })
          return m
        })
      }
      return data
    })

export const getProductBySlug = ({
  slug,
  storeId,
}: {
  slug: string
  storeId: string
}): Promise<Product | null> =>
  prisma.product
    .findFirst({
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
          orderBy: {
            ordinal: 'asc',
          },
          include: {
            items: {
              where: {
                active: true,
              },
              orderBy: {
                ordinal: 'asc',
              },
            },
          },
        },
      },
    })
    .then((data: Product | null) => {
      if (data) {
        data.modifiers = data!.modifiers!.map((m) => {
          // @ts-ignore
          delete m?.ordinal
          m.items = m?.items!.map((i) => {
            // @ts-ignore
            delete i.ordinal
            return i
          })
          return m
        })
      }
      return data
    })

const getLastDays = (days: number) =>
  new Date(Date.now() - 24 * days * 60 * 60 * 1000)

export const getProductsByStore = async ({
  storeId,
  published,
  archived,
}: {
  storeId: string
  published?: boolean
  archived?: boolean
}): Promise<StripedProduct[]> =>
  prisma.product.findMany({
    where: {
      storeId,
      public: published,
      archived: archived || false,
      OR: archived
        ? [
            {
              archivedAt: {
                gte: getLastDays(30).toISOString(),
              },
            },
            {
              archivedAt: {
                equals: null,
              },
            },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      price: true,
      type: true,
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
      meta: true,
      archivedAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

export const upsertProduct = async (
  product: Partial<Product>,
  userId: string
): Promise<Product | null> => {
  let c: _Product | null
  if (product.id) {
    c = await prisma.product.findFirst({
      where: {
        id: product.id,
        store: {
          userId,
        },
      },
    })
    if (!c) {
      throw new Error('not allowed')
    }
    await prisma.product.update({
      where: {
        id: c?.id,
      },
      data: {
        name: product.name,
        price: product.price,
        type: product.type,
        minQuantity: product.minQuantity || null,
        public: product.public,
        description: product.description,
        meta: product.meta,
        archived: product.archived,
        archivedAt:
          product.archived !== undefined || product.archived !== null
            ? product.archived
              ? new Date()
              : null
            : undefined,
        storeCategory: product.storeCategoryId
          ? {
              connect: {
                id: product.storeCategoryId || undefined,
              },
            }
          : undefined,
        template: product.template,
        templateDraft: product.templateDraft as Prisma.InputJsonObject,
      },
    })
    if (product.modifiers) {
      const transactions = product.modifiers!.map((m, idx) =>
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
            id: m.id,
            product: {
              connect: {
                id: product.id,
              },
            },
            ordinal: idx,
            type: m.type,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
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
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            ordinal: idx,
            items: {
              create: m.items
                ?.filter((i) => !i.id)
                .map((i, idx) => ({
                  ordinal: idx,
                  name: i.name,
                  meta: i.meta,
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

      const itemsTransactions = (product?.modifiers || [])
        .map((m) => m?.items?.filter((i) => i.id) || [])
        .reduce((a, b) => [...a, ...b], [])
        .map((i, idx) =>
          prisma.productModifierItem.update({
            where: {
              id: i.id,
            },
            data: {
              ordinal: idx,
              active: i.active,
              name: i.name,
              meta: i.meta,
              cost: i.cost,
              percentage: i.percentage,
            },
          })
        )

      const _modifiers = await prisma.$transaction(transactions)
      const _items = await prisma.$transaction(itemsTransactions)
    }

    const final = await getProductBySlug({
      storeId: product.storeId!,
      slug: product.slug!,
    })
    return final
  }
  let slug = slugify(product.name!)
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

  return (await prisma.product.create({
    data: {
      name: product.name!,
      price: product.price!,
      type: product.type,
      public: product.public!,
      description: product.description,
      meta: product.meta,
      store: {
        connect: {
          id: product.storeId!,
        },
      },
      storeCategory: {
        connect: {
          id: product.storeCategoryId!,
        },
      },
      template: product.template || defaultTemplate,
      templateDraft: product.template || defaultTemplate,
      modifiers: {
        create: product
          .modifiers!.filter((m) => m.active)
          .map((m, idx) => ({
            id: m.id,
            ordinal: idx,
            name: m.name,
            type: m.type,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            items: {
              create: m.items!.map((i, idx) => ({
                ordinal: idx,
                name: i.name,
                cost: i.cost,
                meta: i.meta,
                percentage: i.percentage,
              })),
            },
          })),
      },
      slug,
    },
  })) as unknown as Product
}

export const createProductsFromBatch = async (
  products: Partial<Product>[],
  storeId: string
) => {
  const data = products.map((product) => ({
    name: product.name!,
    price: product.price!,
    type: product.type,
    public: product.public!,
    description: product.description,
    meta: product.meta,
    slug: product.slug || '',
    store: {
      connect: {
        id: storeId,
      },
    },
    storeCategory: {
      connect: {
        id: product.storeCategoryId!,
      },
    },
    template: product.template,
    templateDraft: product.template,
    modifiers: {
      create: product
        .modifiers!.filter((m) => m.active)
        .map((m, idx) => ({
          id: m.id,
          ordinal: idx,
          name: m.name,
          type: m.type,
          defaultValue: m.defaultValue || undefined,
          templateAccessor: m.templateAccessor || undefined,
          items: {
            create: m.items!.map((i, idx) => ({
              ordinal: idx,
              name: i.name,
              cost: i.cost,
              meta: i.meta,
              percentage: i.percentage,
            })),
          },
        })),
    },
  }))
  const batch = await prisma.product.createMany({
    data,
  })
  return batch.count
}
