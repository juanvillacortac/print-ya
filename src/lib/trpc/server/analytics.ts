import * as db from '$lib/db'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { createServer } from '../shared'

const searchMutations = createServer().mutation('create', {
  input: z.object({
    storeId: z.string().cuid(),
    searchTerm: z.string(),
    categorySlug: z.string().optional(),
  }),
  resolve: async ({ input, ctx }) => {
    console.log(input)
    const { customerId } = await db.getCustomerDetails(ctx.event)
    const customer = customerId ? await db.getCustomer({ customerId }) : null
    const entry = await db.prisma.searchHistory.create({
      data: {
        ip: ctx.event.clientAddress,
        searchTerm: input.searchTerm,
        category: input.categorySlug
          ? {
              connect: {
                slug_storeId: {
                  slug: input.categorySlug,
                  storeId: input.storeId,
                },
              },
            }
          : undefined,
        store: {
          connect: {
            id: input.storeId,
          },
        },
        customer:
          customerId && customer
            ? {
                connect: {
                  id: customerId,
                },
              }
            : undefined,
      },
    })
    return entry
  },
})

const searchQueries = createServer().query('list', {
  input: z.object({
    storeId: z.string().cuid(),
    filter: z
      .object({
        searchTerm: z.string().optional(),
        categorySlug: z.string().optional(),
        customerId: z.string().cuid().optional(),
      })
      .optional(),
    orderBy: z
      .object({
        searchTerm: z.enum(['asc', 'desc']).optional(),
        createdAt: z.enum(['asc', 'desc']).optional(),
      })
      .optional()
      .default({
        createdAt: 'desc',
      }),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).optional().default(20),
  }),
  resolve: async ({ input: { filter, page, pageSize, orderBy, storeId } }) => {
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
    const [count, entries] = await db.prisma.$transaction([
      db.prisma.searchHistory.count({ where }),
      db.prisma.searchHistory.findMany({
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
  },
})

const searchRouter = createServer().merge(searchMutations).merge(searchQueries)

export default createServer().merge('searchHistory:', searchRouter)
