import { Prisma, prisma } from '../prisma.js'
import type { SearchHistory } from 'src/types.js'

export const createSearchEntry = async ({
  ip,
  searchTerm,
  categorySlug,
  storeId,
  customerId,
}: {
  ip: string
  searchTerm: string
  storeId: string
  categorySlug?: string
  customerId?: string
}): Promise<SearchHistory> => {
  return await prisma.searchHistory.create({
    data: {
      ip,
      searchTerm,
      category: categorySlug
        ? {
            connect: {
              slug_storeId: {
                slug: categorySlug,
                storeId,
              },
            },
          }
        : undefined,
      store: {
        connect: {
          id: storeId,
        },
      },
      customer: customerId
        ? {
            connect: {
              id: customerId,
            },
          }
        : undefined,
    },
    include: {
      category: true,
      customer: true,
    },
  })
}

export const listSearchEntries = async ({
  storeId,
  filter,
  page,
  pageSize,
  orderBy,
}: {
  storeId: string
  filter?: {
    searchTerm?: string
    categorySlug?: string
    customerId?: string
  }
  page: number
  pageSize: number
  orderBy?: Prisma.SearchHistoryFindManyArgs['orderBy'] | undefined
}): Promise<{
  count: number
  entries: SearchHistory[]
}> => {
  let AND: Prisma.SearchHistoryWhereInput[] = []
  if (filter?.searchTerm)
    AND = [
      ...AND,
      {
        OR: [
          {
            searchTerm: {
              contains: filter?.searchTerm,
            },
          },
          {
            customer: {
              firstName: {
                contains: filter?.searchTerm,
              },
            },
          },
          {
            customer: {
              lastName: {
                contains: filter?.searchTerm,
              },
            },
          },
          {
            ip: {
              contains: filter?.searchTerm,
            },
          },
        ],
      },
    ]
  const where: Prisma.SearchHistoryWhereInput = {
    storeId,
    category: filter?.categorySlug
      ? {
          slug: filter.categorySlug,
          id: storeId,
        }
      : undefined,
    AND,
    customerId: filter?.customerId,
  }
  const [count, entries] = await prisma.$transaction([
    prisma.searchHistory.count({ where }),
    prisma.searchHistory.findMany({
      orderBy,
      where,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
      include: {
        category: true,
        customer: true,
      },
    }),
  ])
  return {
    count,
    entries,
  }
}
