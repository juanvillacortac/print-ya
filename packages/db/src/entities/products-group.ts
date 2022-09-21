import { Prisma, prisma } from 'src/prisma.js'
import type { ProductsGroup, _ProductsGroup } from 'src/types.js'

export async function deleteProductsGroup(id: string) {
  const ok = await prisma.$transaction(async ($prisma) => {
    await $prisma.product.updateMany({
      where: {
        productsGroupId: id,
      },
      data: {
        productsGroupId: null,
      },
    })
    const deleted = await $prisma.productsGroup.delete({
      where: { id },
    })
    return deleted != null
  })
  return ok
}

export async function getProductsGroup(
  id: string
): Promise<ProductsGroup | null> {
  return prisma.$transaction(async ($prisma) => {
    const group = (await $prisma.productsGroup.findUnique({
      where: {
        id,
      },
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
    })) as ProductsGroup | null

    if (group) {
      group.products = await $prisma.product.count({
        where: {
          archived: false,
          productsGroupId: group.id,
        },
      })
    }

    return group
  })
}

export async function getProductsGroups({
  storeId,
  filter,
  page = 1,
  pageSize = 20,
  orderBy,
}: {
  storeId: string
  filter?: string
  orderBy?: {
    name?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
  }
  page?: number
  pageSize?: number
}): Promise<{
  count: number
  groups: ProductsGroup[]
}> {
  let AND: Prisma.ProductsGroupWhereInput[] = []
  if (filter)
    AND = [
      ...AND,
      {
        OR: [
          {
            name: {
              contains: filter,
            },
          },
          {
            description: {
              contains: filter,
            },
          },
        ],
      },
    ]
  const where: Prisma.ProductsGroupWhereInput = {
    storeId,
    AND,
  }
  const [count, groups] = await prisma.$transaction([
    prisma.productsGroup.count({ where }),
    prisma.productsGroup.findMany({
      orderBy,
      where,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
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
    }),
  ])
  const counts = await prisma.$transaction(
    groups.map((g) =>
      prisma.product.count({
        where: {
          archived: false,
          productsGroupId: g.id,
        },
      })
    )
  )
  return {
    count,
    groups: groups.map((g, idx) => ({
      ...(g as unknown as ProductsGroup),
      meta: g.meta as ProductsGroup['meta'],
      products: counts.at(idx),
    })),
  }
}

export async function upsertProductGroup(
  group: Partial<ProductsGroup>,
  userId: string
): Promise<ProductsGroup | null> {
  let g: _ProductsGroup
  if (group.id) {
    g = await prisma.productsGroup.findFirstOrThrow({
      where: {
        id: group.id,
        store: {
          userId,
        },
      },
    })

    await prisma.productsGroup.update({
      where: {
        id: group.id,
      },
      data: {
        name: group.name,
        description: group.description,
        meta: group.meta,
      },
    })
    if (group.modifiers) {
      const transactions = group.modifiers.map((m, idx) =>
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
            ordinal: idx,
            type: m.type,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            productsGroupId: group.id,
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

      const itemsTransactions = (group.modifiers || [])
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

    return await getProductsGroup(group.id)
  }

  const created = await prisma.productsGroup.create({
    select: {
      id: true,
    },
    data: {
      name: group.name!,
      description: group.description,
      meta: group.meta,
      store: {
        connect: {
          id: group.storeId!,
        },
      },
      modifiers: group.modifiers?.length
        ? {
            create: group.modifiers
              .filter((m) => m.active)
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
          }
        : undefined,
    },
  })
  return await getProductsGroup(created.id)
}

export async function bindManyProductsToGroup({
  productsIds,
  storeId,
  groupId,
  templateFromGroup,
}: {
  storeId: string
  productsIds: string[]
  groupId: string | null
  templateFromGroup?: boolean
}) {
  await prisma.product.updateMany({
    where: {
      id: {
        in: productsIds,
      },
      storeId,
    },
    data: {
      productsGroupId: groupId,
      templateFromGroup: templateFromGroup || undefined,
    },
  })
}
