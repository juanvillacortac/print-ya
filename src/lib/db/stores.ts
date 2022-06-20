import { prisma, slugify } from './common'
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

export const getStoreBySlugOrHost = ({
  slug,
  host: customDomain,
}: {
  slug?: string
  host?: string
}): Promise<Store | null> =>
  prisma.store.findUnique({
    where: {
      slug,
      customDomain,
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

export const getStoreBySubdomain = ({
  slug,
}: {
  slug: string
}): Promise<Store | null> =>
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
  let c: StoreCategory | null
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
  let slug = slugify(category.name)
  const coincidences = await prisma.storeCategory.findMany({
    where: {
      slug: {
        startsWith: slug,
      },
      storeId: category.storeId,
    },
  })
  if (coincidences.length) {
    slug = `${slug}-${coincidences.length}`
  }
  return await prisma.storeCategory.create({
    data: {
      name: category.name,
      slug,
      store: {
        connect: {
          id: category.storeId,
        },
      },
    },
  })
}

export const upsertStore = async (
  store: Partial<Store>,
  userId: string
): Promise<Store> => {
  let s: Store | null
  if (store.id) {
    s = await prisma.store.findUnique({ where: { id: store.id } })
    if (!s || s.userId !== userId) {
      throw new Error('not allowed')
    }
    return await prisma.store.update({
      where: {
        id: s?.id,
      },
      data: {
        favicon: store.favicon,
        logo: store.logo,
        name: store.name,
        slug: slugify(store.slug!),
        customDomain: store.customDomain,
      },
    })
  }
  return await prisma.store.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      favicon: store.favicon,
      logo: store.logo,
      name: store.name,
      slug: store.slug!,
      customDomain: store.customDomain,
    },
  })
}
