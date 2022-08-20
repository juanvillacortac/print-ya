import * as db from '@shackcart/db'
import { z } from 'zod'
import { createServer } from '../shared'

const searchMutations = createServer().mutation('create', {
  input: z.object({
    storeId: z.string().cuid(),
    searchTerm: z.string(),
    categorySlug: z.string().optional(),
  }),
  resolve: async ({ input, ctx }) => {
    const customerId = await ctx.event.locals.customerId
    const customer = customerId ? await db.getCustomer({ customerId }) : null
    const entry = await db.createSearchEntry({
      ip: ctx.event.clientAddress,
      searchTerm: input.searchTerm,
      categorySlug: input.categorySlug,
      storeId: input.storeId,
      customerId: customer ? customer.id : undefined,
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
    return await db.listSearchEntries({
      storeId,
      orderBy,
      page,
      pageSize,
      filter,
    })
  },
})

const searchRouter = createServer().merge(searchMutations).merge(searchQueries)

export default createServer().merge('searchHistory:', searchRouter)
