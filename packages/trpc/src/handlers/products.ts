import * as db from '@shackcart/db'
import {
  getProductById,
  getProductBySlug,
  getProductsByStore,
  getStore,
  getTags,
  Product,
  upsertProduct,
} from '@shackcart/db'
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
  .mutation('upsert', {
    input: (input: unknown) =>
      input as { storeSlug: string; data: Partial<Product> },
    resolve: async ({ ctx, input }) => {
      const { userId } = ctx
      if (!userId) {
        throw new Error('not allowed')
      }
      return await upsertProduct(input.data, userId)
    },
  })

const queries = createServer()
  .query('listTags', {
    input: z.object({
      name: z.string().optional(),
      storeId: z.string().cuid(),
    }),
    resolve: ({ input }) => getTags(input),
  })
  .query('list', {
    input: z.object({
      storeSlug: z.string(),
      filter: z
        .object({
          name: z.string().optional(),
          categoryId: z.string().cuid().optional(),
          public: z.boolean().optional(),
          archived: z.boolean().optional(),
          shopifyImportId: z.string().optional(),
        })
        .optional(),
      orderBy: z
        .object({
          name: order.optional(),
          price: order.optional(),
          createdAt: order.optional(),
        })
        .optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).optional().default(20),
    }),
    resolve: async ({ input }) => {
      const store = await getStore({ slug: input.storeSlug })
      if (!store) {
        return {
          count: 0,
          products: [],
        }
      }
      return await getProductsByStore({
        storeId: store.id,
        filter: {
          ...input.filter,
        },
        orderBy: input.orderBy,
        page: input.page,
        pageSize: input.pageSize,
      })
    },
  })
  .query('listDeleted', {
    input: z.object({
      storeSlug: z.string(),
      filter: z
        .object({
          name: z.string().optional(),
          public: z.boolean().optional(),
        })
        .optional(),
      orderBy: z
        .object({
          name: order.optional(),
          price: order.optional(),
          createdAt: order.optional(),
        })
        .optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).optional().default(20),
    }),
    resolve: async ({ input }) => {
      const store = await getStore({ slug: input.storeSlug })
      if (!store) {
        return {
          count: 0,
          products: [],
        }
      }
      return await db.getProductsByStore({
        storeId: store.id,
        filter: {
          ...input.filter,
          archived: true,
        },
        orderBy: input.orderBy,
        page: input.page,
        pageSize: input.pageSize,
      })
    },
  })
  .query('getById', {
    input: z.string().cuid(),
    resolve: async ({ input }) => {
      return await getProductById(input)
    },
  })
  .query('getBySlug', {
    input: z.object({
      storeSlug: z.string(),
      productSlug: z.string(),
    }),
    resolve: async ({ input }) => {
      const store = await getStore({ slug: input.storeSlug })
      if (!store) {
        return null
      }
      return await getProductBySlug({
        slug: input.productSlug,
        storeId: store.id,
      })
    },
  })

export default createServer().merge(mutations).merge(queries)
