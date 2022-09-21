import * as db from '@shackcart/db'
import type { ProductsGroup } from '@shackcart/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createServer } from '../shared.js'

const order = z.enum(['desc', 'asc'])

const mutations = createServer()
  .middleware(async ({ ctx, next }) => {
    const { userId } = await ctx.session.auth({ verify: true })
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        ...ctx,
        userId,
      },
    })
  })
  .mutation('bindManyProducts', {
    input: z.object({
      storeId: z.string(),
      groupId: z.string(),
      productsIds: z.array(z.string()),
      templateFromGroup: z.boolean().optional(),
    }),
    resolve: ({ input }) => db.bindManyProductsToGroup(input),
  })
  .mutation('delete', {
    input: z.string().cuid(),
    resolve: ({ input }) => db.deleteProductsGroup(input),
  })
  .mutation('upsert', {
    input: (input: unknown) =>
      input as { storeSlug: string; data: Partial<ProductsGroup> },
    resolve: async ({ ctx, input }) => {
      return await db.upsertProductGroup(input.data, ctx.userId)
    },
  })

const queries = createServer()
  .query('list', {
    input: z.object({
      storeId: z.string(),
      filter: z.string().optional(),
      orderBy: z
        .object({
          name: order.optional(),
          createdAt: order.optional(),
        })
        .optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).optional().default(20),
    }),
    resolve: async ({ input }) => {
      return await db.getProductsGroups({
        storeId: input.storeId,
        filter: input.filter,
        orderBy: input.orderBy,
        page: input.page,
        pageSize: input.pageSize,
      })
    },
  })
  .query('get', {
    input: z.string().cuid(),
    resolve: async ({ input }) => {
      return await db.getProductsGroup(input)
    },
  })

export default createServer().merge(mutations).merge(queries)
