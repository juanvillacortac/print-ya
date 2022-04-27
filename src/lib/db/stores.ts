import { prisma } from './common'
import type { Store as _Store, StoreCategory } from '@prisma/client'

export type Store = _Store & {
  categories?: StoreCategory[]
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
      name: 'desc',
    },
  })

export const getStoreBySlug = ({ slug }: { slug: string }): Promise<Store> =>
  prisma.store.findUnique({
    where: {
      slug,
    },
    include: {
      categories: {
        orderBy: {
          name: 'desc',
        },
      },
    },
  })
