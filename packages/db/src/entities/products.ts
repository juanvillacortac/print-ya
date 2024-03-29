import { utils } from '@shackcart/shared'
import scuid from 'scuid'
import { Prisma, prisma } from 'src/prisma.js'
import type {
  Product,
  StripedProduct,
  ProductTag,
  _Product,
  ShopifyImportStatus,
  ShopifyImport,
  ProductCategory,
  Overwrite,
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
        products_categories: {
          include: {
            category: true,
          },
        },
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
        data.categories =
          data.products_categories?.map((pc) => pc.category) || []
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
        products_categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        group: {
          include: {
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
        data.categories =
          data.products_categories?.map((pc) => pc.category) || []
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

export const getShopifyImports = async ({
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
    id?: string
    status?: ShopifyImportStatus[]
  }
  orderBy?: {
    createdAt?: 'desc' | 'asc'
  }
  page?: number
  pageSize?: number
}): Promise<{
  count: number
  imports: (ShopifyImport & { products: number })[]
}> => {
  const where: Prisma.ShopifyImportWhereInput = {
    storeId,
    id: filter?.id
      ? {
          startsWith: filter.id,
        }
      : undefined,
    status: filter?.status
      ? {
          in: filter.status,
        }
      : undefined,
  }
  const [count, imports] = await prisma.$transaction([
    prisma.shopifyImport.count({ where }),
    prisma.shopifyImport.findMany({
      orderBy,
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
    }),
  ])
  return {
    count,
    imports: imports.map((p) => ({ ...p, products: p._count.products })),
  }
}

export const touchShopifyImport = async (storeId: string) =>
  prisma.shopifyImport.create({
    data: {
      storeId,
    },
  })

export const updateShopifyImportStatus = async ({
  id,
  status,
}: {
  id: string
  status: ShopifyImportStatus
}): Promise<ShopifyImport | null> => {
  let item: ShopifyImport | undefined
  if (status === 'imported') {
    item = await prisma.$transaction(async ($prisma) => {
      await $prisma.product.updateMany({
        data: {
          shopifyImportId: null,
        },
        where: {
          shopifyImportId: id,
        },
      })
      return await $prisma.shopifyImport.update({
        data: {
          status,
        },
        where: {
          id,
        },
      })
    })
  } else {
    item = await prisma.shopifyImport.update({
      data: {
        status,
      },
      where: {
        id,
      },
    })
  }
  return item || null
}

export const deleteCategory = async (
  categoryId: string
): Promise<ProductCategory> => {
  const category = await prisma.$transaction(async ($prisma) => {
    await $prisma.categoriesOnProducts.deleteMany({
      where: {
        categoryId,
      },
    })
    const category = await $prisma.productCategory.delete({
      where: {
        id: categoryId,
      },
    })
    return category
  })
  return category
}

export const upsertCategory = async ({
  id,
  name,
  storeId,
}: Overwrite<
  ProductCategory,
  Partial<Pick<ProductCategory, 'id' | 'storeId'>>
>): Promise<ProductCategory> =>
  prisma.productCategory.upsert({
    create: {
      name,
      storeId: storeId || '',
    },
    update: {
      name,
    },
    where: {
      id: id || '',
    },
  })

export const reviewProductFromShopifyImport = async (
  productId: string
): Promise<Product | null> => {
  const [shouldClose, product] = await prisma.$transaction(async ($prisma) => {
    const og = await $prisma.product.findFirst({
      include: {
        shopifyImport: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
      where: {
        id: productId,
        shopifyImportId: {
          not: null,
        },
      },
    })
    if (!og) return [null, null]
    await $prisma.product.update({
      where: {
        id: og.id,
      },
      data: {
        shopifyImportId: null,
      },
    })
    const product = await getProductById(og.id)
    return [
      og.shopifyImport && og.shopifyImport?._count.products == 1
        ? og.shopifyImportId
        : null,
      product,
    ]
  })
  if (shouldClose) {
    updateShopifyImportStatus({ id: shouldClose, status: 'imported' })
  }
  return product
}

export const getProductsByStore = async ({
  storeId,
  ids,
  filter,
  orderBy = {
    createdAt: 'desc',
  },
  page = 1,
  pageSize = 20,
}: {
  storeId: string
  ids?: string[]
  filter?: {
    name?: string
    public?: boolean
    productsGroupId?: string
    archived?: boolean
    categoryId?: string | null
    shopifyImportId?: string | null
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
  if (ids)
    AND = [
      ...AND,
      {
        id: {
          in: ids,
        },
      },
    ]
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
    products_categories: filter?.categoryId
      ? {
          some: {
            categoryId: filter.categoryId,
          },
        }
      : undefined,
    shopifyImportId: filter?.shopifyImportId || null,
    productsGroupId: filter?.productsGroupId,
    AND,
  }
  const [count, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      orderBy,
      where,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
      include: {
        group: true,
        products_categories: {
          include: {
            category: true,
          },
        },
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
    products: products.map((p) => ({
      ...(p as unknown as StripedProduct),
      categories: p.products_categories.map((pc) => pc.category),
      tags: p.tags.map((t) => t.tag),
    })),
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

    if (product.categories) {
      await prisma.categoriesOnProducts.deleteMany({
        where: {
          productId: product.id,
        },
      })
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
        templateFromGroup: product.templateFromGroup,
        meta: product.meta,
        archived: product.archived,
        mockups: product.mockups,
        group: product.productsGroupId
          ? {
              connect: {
                id: product.productsGroupId,
              },
            }
          : undefined,
        archivedAt:
          product.archived !== undefined || product.archived !== null
            ? product.archived
              ? new Date()
              : null
            : undefined,
        // storeCategory:
        //   product.storeCategoryId === null
        //     ? {
        //         disconnect: true,
        //       }
        //     : product.storeCategoryId
        //     ? {
        //         connect: {
        //           id: product.storeCategoryId || undefined,
        //         },
        //       }
        //     : undefined,
        template: product.template,
        templateDraft: product.templateDraft as Prisma.InputJsonObject,
        products_categories: {
          create: product.categories
            ? product.categories.map((c) => {
                return {
                  category: {
                    connectOrCreate: {
                      create: {
                        name: c.name,
                        storeId: product.storeId || '',
                      },
                      where: {
                        name_storeId: {
                          name: c.name,
                          storeId: product.storeId || '',
                        },
                      },
                    },
                  },
                }
              })
            : [],
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
      storeId: c.storeId!,
      slug: c.slug!,
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
      templateFromGroup: product.templateFromGroup,
      mockups: product.mockups,
      store: {
        connect: {
          id: product.storeId!,
        },
      },
      group: product.productsGroupId
        ? {
            connect: {
              id: product.productsGroupId,
            },
          }
        : undefined,
      products_categories: {
        create: product.categories
          ? product.categories.map((c) => {
              return {
                category: {
                  connectOrCreate: {
                    create: {
                      name: c.name,
                      storeId: product.storeId || '',
                    },
                    where: {
                      name_storeId: {
                        name: c.name,
                        storeId: product.storeId || '',
                      },
                    },
                  },
                },
              }
            })
          : [],
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
      shopifyImportId: p.shopifyImportId || undefined,
      template: p.template,
      templateDraft: p.template,
    }
    const categories =
      p.categories?.map((t) => ({
        name: t.name,
        productId: product.id,
        storeId: storeId,
      })) || []
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
    return { product, tags, modifiers, items, categories }
  })

  const batch = await prisma.$transaction(
    async ($prisma) => {
      const products = await $prisma.product.createMany({
        data: data.map(({ product }) => ({
          storeId,
          id: product.id,
          name: product.name,
          price: product.price || 0.1,
          slug: product.slug,
          meta: product.meta,
          type: product.type,
          shopifyImportId: product.shopifyImportId,
          template: product.template,
          templateDraft: product.templateDraft,
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
      const tags = await $prisma.productTag.createMany({
        data: data
          .flatMap(({ tags }) => tags)
          .map((t) => ({
            name: t.name,
            storeId,
          })),

        skipDuplicates: true,
      })
      const existentTags = await $prisma.productTag.findMany({
        where: {
          name: {
            in: data.flatMap(({ tags }) => tags).map((t) => t.name),
          },
          storeId,
        },
      })

      let tagsDict = new Map<string, string>()
      existentTags.forEach((t) => tagsDict.set(t.name, t.id))

      const tagsOnProducts = await $prisma.tagsOnProducts.createMany({
        data: data
          .flatMap(({ tags }) => tags)
          .filter((t) => tagsDict.get(t.name))
          .map((t) => ({
            productId: t.productId,
            productTagId: tagsDict.get(t.name) || '',
          })),
        skipDuplicates: true,
      })

      const existentCategories = await $prisma.productCategory.findMany({
        where: {
          name: {
            in: data.flatMap(({ categories }) => categories).map((t) => t.name),
          },
          storeId,
        },
      })

      let categoriesDict = new Map<string, string>()
      existentCategories.forEach((t) => categoriesDict.set(t.name, t.id))

      const categoriesOnProducts =
        await $prisma.categoriesOnProducts.createMany({
          data: data
            .flatMap(({ categories }) => categories)
            .filter((t) => categoriesDict.get(t.name))
            .map((t) => ({
              productId: t.productId,
              categoryId: categoriesDict.get(t.name) || '',
            })),
          skipDuplicates: true,
        })
      return products.count
    },
    {
      maxWait: 1000000,
      timeout: 1200000,
    }
  )
  return batch
}

export async function migrateCategories(tags: string[], storeId: string) {
  await prisma.productCategory.createMany({
    data: tags.map((name) => ({
      name,
      storeId,
    })),
    skipDuplicates: true,
  })
  const categories = await prisma.productCategory.findMany({
    where: {
      name: {
        in: tags,
      },
      storeId,
    },
  })
  const map = new Map(categories.map((c) => [c.name, c.id]))
  const matched = (
    await prisma.tagsOnProducts.findMany({
      include: {
        tag: true,
      },
      where: {
        product: {
          archived: false,
        },
        tag: {
          storeId,
          name: {
            in: tags,
          },
        },
      },
    })
  ).map((t) => ({
    categoryId: map.get(t.tag.name) || '',
    productId: t.productId,
  }))
  const { count } = await prisma.categoriesOnProducts.createMany({
    data: matched,
    skipDuplicates: true,
  })
  return count
}
