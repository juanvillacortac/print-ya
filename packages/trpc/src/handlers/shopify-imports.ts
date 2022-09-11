import { z } from 'zod'
import { createServer } from 'src/shared.js'
import { workerCaller } from 'src/workers/index.js'
import * as db from '@shackcart/db'

const order = z.enum(['desc', 'asc'])
const status = z.enum([
  'failed',
  'imported',
  'in_review',
  'pending',
  'processing',
])

export default createServer()
  .mutation('create', {
    input: z.object({
      supabasePath: z.string(),
      storeId: z.string().cuid(),
      categories: z.array(z.string()).optional(),
    }),
    resolve: async ({ input, ctx }) => {
      const { userId } = await ctx.session.auth({ verify: true })
      if (!userId) return null

      const lot = await db.touchShopifyImport(input.storeId)

      workerCaller(ctx).mutation('shopifyImport:create', {
        ...input,
        userId,
        importId: lot.id,
      })
      return lot
    },
  })
  .mutation('reviewProduct', {
    input: z.string({ description: 'productId' }),
    resolve: async ({ input, ctx }) => {
      const { userId } = await ctx.session.auth({ verify: true })
      if (!userId) return null
      return await db.reviewProductFromShopifyImport(input)
    },
  })
  .mutation('reviewImport', {
    input: z.string({ description: 'importId' }),
    resolve: async ({ input, ctx }) => {
      const { userId } = await ctx.session.auth({ verify: true })
      if (!userId) return null
      return await db.updateShopifyImportStatus({
        id: input,
        status: 'imported',
      })
    },
  })
  .query('list', {
    input: z.object({
      storeId: z.string().cuid(),
      filter: z
        .object({
          id: z.string().optional(),
          status: z.array(status).optional(),
        })
        .optional(),
      orderBy: z
        .object({
          id: order.optional(),
          createdAt: order.optional(),
        })
        .optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).optional().default(20),
    }),
    resolve: async ({ input }) => {
      return await db.getShopifyImports(input)
    },
  })
