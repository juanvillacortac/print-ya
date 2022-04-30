import { prisma } from './common'
import type { Store as _Store, StoreCategory } from '@prisma/client'

export type Store = _Store & {
  categories?: (StoreCategory & {
    _count: {
      products: number
    }
  })[]
}

export const getUserStores = ({
  userId,
}: {
  userId: string
}): Promise<Store[]> =>
  prisma.store.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: 'asc',
    },
  })

export const getStoreBySlug = ({ slug }: { slug: string }): Promise<Store> =>
  prisma.store.findUnique({
    where: {
      slug,
    },
    include: {
      categories: {
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  })

export const upsertStoreCategory = async (
  category: StoreCategory
): Promise<StoreCategory> => {
  let c: StoreCategory
  if (category.id) {
    c = await prisma.storeCategory.findFirst({
      where: { id: category.id, storeId: category.storeId },
    })
    if (!c && !category.id) {
      throw new Error('not allowed')
    }
    return await prisma.storeCategory.update({
      where: {
        id: c?.id,
      },
      data: {
        name: category.name,
      },
    })
  }
  return await prisma.storeCategory.create({
    data: {
      name: category.name,
      store: {
        connect: {
          id: category.storeId,
        },
      },
    },
  })
}
