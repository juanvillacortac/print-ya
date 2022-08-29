import { utils } from '@shackcart/shared'
import scuid from 'scuid'
import { Prisma, prisma } from 'src/prisma.js'
import type {
  Product,
  StripedProduct,
  ProductTag,
  _Product,
} from 'src/types.js'

export const getTags = ({
  name,
  storeId,
}: {
  name?: string
  storeId: string
}): Promise<ProductTag[]> =>
  prisma.productTag.findMany({
    where: {
      name: name
        ? {
            contains: name,
          }
        : undefined,
      storeId,
    },
    orderBy: {
      name: 'asc',
    },
  })

export const getProductById = (id: string): Promise<Product | null> =>
  prisma.product
    .findUnique({
      where: {
        id,
      },
      include: {
        storeCategory: true,
        tags: {
          include: {
            tag: true,
          },
        },
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
    .then((data) => {
      if (data) {
        // @ts-ignore
        data.tags = data.tags?.map((t) => t.tag) || []
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
      return data as Product | null
    })

export const getProductBySlug = ({
  slug,
  storeId,
}: {
  slug: string
  storeId: string
}): Promise<Product | null> =>
  prisma.product
    .findUnique({
      where: {
        slug_storeId: {
          slug,
          storeId,
        },
      },
      include: {
        storeCategory: true,
        tags: {
          include: {
            tag: true,
          },
        },
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
    .then((data) => {
      if (data) {
        // @ts-ignore
        data.tags = data.tags?.map((t) => t.tag) || []
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
      return data as Product | null
    })

const getLastDays = (days: number) =>
  new Date(Date.now() - 24 * days * 60 * 60 * 1000)

export const getProductsByStore = async ({
  storeId,
  filter,
  orderBy = {
    createdAt: 'desc',
  },
  page = 1,
  pageSize = 20,
}: {
  storeId: string
  filter?: {
    name?: string
    public?: boolean
    archived?: boolean
    categoryId?: string | null
  }
  orderBy?: {
    name?: 'desc' | 'asc'
    price?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
  }
  page?: number
  pageSize?: number
}): Promise<{
  count: number
  products: StripedProduct[]
}> => {
  let AND: Prisma.ProductWhereInput[] = []
  if (filter?.name)
    AND = [
      ...AND,
      {
        OR: [
          {
            name: {
              contains: filter?.name,
            },
          },
          {
            tags: {
              some: {
                tag: {
                  storeId,
                  name: {
                    contains: filter?.name,
                  },
                },
              },
            },
          },
        ],
      },
    ]
  if (filter?.archived)
    AND = [
      ...AND,
      {
        OR: [
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
        ],
      },
    ]
  const where: Prisma.ProductWhereInput = {
    storeId,
    public: filter?.public,
    archived: filter?.archived || false,
    storeCategoryId: filter?.categoryId,
    AND,
  }
  const [count, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      orderBy,
      where,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
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
        archived: true,
        template: true,
        minQuantity: true,
        meta: true,
        archivedAt: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
  ])
  return {
    count,
    products: products.map((p) => ({ ...p, tags: p.tags.map((t) => t.tag) })),
  }
}

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

    if (product.tags) {
      await prisma.tagsOnProducts.deleteMany({
        where: {
          productId: product.id,
        },
      })
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
        storeCategory:
          product.storeCategoryId === null
            ? {
                disconnect: true,
              }
            : product.storeCategoryId
            ? {
                connect: {
                  id: product.storeCategoryId || undefined,
                },
              }
            : undefined,
        template: product.template,
        templateDraft: product.templateDraft as Prisma.InputJsonObject,
        tags: {
          create: product.tags
            ? product.tags.map((t) => {
                return {
                  tag: {
                    connectOrCreate: {
                      create: {
                        name: t.name,
                        storeId: product.storeId || '',
                      },
                      where: {
                        name_storeId: {
                          name: t.name,
                          storeId: product.storeId || '',
                        },
                      },
                    },
                  },
                }
              })
            : [],
        },
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
  let slug = utils.slugify(product.name!)
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

  const defaultTemplate = {
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
      tags: {
        create: product.tags
          ? product.tags.map((t) => {
              return {
                tag: {
                  connectOrCreate: {
                    create: {
                      name: t.name,
                      storeId: product.storeId || '',
                    },
                    where: {
                      name_storeId: {
                        name: t.name,
                        storeId: product.storeId || '',
                      },
                    },
                  },
                },
              }
            })
          : [],
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
  const data = products.map((p) => {
    const product = {
      id: scuid(),
      name: p.name!,
      price: p.price!,
      type: p.type,
      public: p.public!,
      description: p.description,
      meta: p.meta,
      slug: p.slug || '',
      storeId,
      storeCategoryId: p.storeCategoryId,
      template: p.template,
      templateDraft: p.template,
    }
    const tags =
      p.tags?.map((t) => ({
        name: t.name,
        productId: product.id,
        storeId: storeId,
      })) || []
    const modifiers =
      p.modifiers?.map((m, idx) => ({
        id: m.id,
        productId: product.id,
        ordinal: idx,
        name: m.name,
        type: m.type,
        defaultValue: m.defaultValue || undefined,
        templateAccessor: m.templateAccessor || undefined,
      })) || []
    const items =
      p.modifiers?.flatMap(({ id, items }) =>
        items.map((i, idx) => ({
          modifierId: id,
          ordinal: idx,
          name: i.name,
          cost: i.cost,
          meta: i.meta,
          percentage: i.percentage,
        }))
      ) || []
    // tags: {
    //   create: product.tags
    //     ? product.tags.map((t) => {
    //         return {
    //           tag: {
    //             connectOrCreate: {
    //               create: {
    //                 name: t.name,
    //                 storeId,
    //               },
    //               where: {
    //                 name_storeId: {
    //                   name: t.name,
    //                   storeId: storeId,
    //                 },
    //               },
    //             },
    //           },
    //         }
    //       })
    //     : [],
    // },
    // modifiers: {
    //   create: product
    //     .modifiers!.filter((m) => m.active)
    //     .map((m, idx) => ({
    //       id: m.id,
    //       ordinal: idx,
    //       name: m.name,
    //       type: m.type,
    //       defaultValue: m.defaultValue || undefined,
    //       templateAccessor: m.templateAccessor || undefined,
    //       items: {
    //         create: m.items!.map((i, idx) => ({
    //           ordinal: idx,
    //           name: i.name,
    //           cost: i.cost,
    //           meta: i.meta,
    //           percentage: i.percentage,
    //         })),
    //       },
    //     })),
    return { product, tags, modifiers, items }
  })

  const batch = await prisma.$transaction(async ($prisma) => {
    const products = await $prisma.product.createMany({
      data: data.map(({ product }) => ({
        id: product.id,
        name: product.name,
        price: product.price || 0.1,
        slug: product.slug,
        meta: product.meta,
        type: product.type,
        storeId: product.storeId,
        template: product.template,
        templateDraft: product.templateDraft,
        storeCategoryId: product.storeCategoryId,
        description: product.description,
        public: product.public,
      })),
      skipDuplicates: true,
    })
    const modifiers = await $prisma.productModifier.createMany({
      data: data
        .flatMap(({ modifiers }) => modifiers)
        .map((m) => ({
          id: m.id,
          ordinal: m.ordinal,
          productId: m.productId,
          name: m.name,
          type: m.type,
          defaultValue: m.defaultValue || undefined,
          templateAccessor: m.templateAccessor || undefined,
        })),
      skipDuplicates: true,
    })
    const items = await $prisma.productModifierItem.createMany({
      data: data
        .flatMap(({ items }) => items)
        .map((i) => ({
          productModifierId: i.modifierId,
          ordinal: i.ordinal,
          name: i.name,
          cost: i.cost,
          meta: i.meta,
          percentage: i.percentage,
        })),
    })
  })
  // const
  // const batch = await prisma.$transaction(
  //   data.map((p) =>
  //     prisma.product.create({
  //       data: p,
  //     })
  //   )
  // )
  return products.length
}
