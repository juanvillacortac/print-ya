import { utils } from '@shackcart/shared'
import { prisma } from 'src/prisma.js'
import type { Store } from 'src/types.js'

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

export const getStore = async ({
  id,
  slug,
  host: customDomain,
}: {
  id?: string
  slug?: string
  host?: string
}): Promise<Store | null> => {
  const store = await prisma.store.findUnique({
    where: {
      id,
      slug,
      customDomain,
    },
    include: {
      productCategories: {
        orderBy: {
          name: 'asc',
        },
      },
    },
  })
  if (!store) return null
  const categories = await prisma.$transaction(
    store.productCategories.map((c) =>
      prisma.categoriesOnProducts.count({
        where: {
          categoryId: c.id,
          product: {
            archived: false,
          },
        },
      })
    )
  )
  const { productCategories, ...data } = store
  return {
    ...data,
    categories: store.productCategories.map((c, idx) => ({
      id: c.id,
      name: c.name,
      storeId: c.storeId,
      count: categories[idx],
    })),
  }
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
        slug: utils.slugify(store.slug!),
        customDomain: store.customDomain,
        contactData: store.contactData || {},
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
      contactData: {
        email: '',
        phone: '',
      },
    },
  })
}
