import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

const order = z.enum(['desc', 'asc'])

const mutations = trpc.router<tRPCContext>().mutation('upsert', {
  input: (input: { storeSlug: string; data: Partial<db.Product> }) => input,
  resolve: async ({ ctx, input }) => {
    console.log(input)
    const { userId } = await db.getUserDetails(ctx.event)
    if (!userId) {
      throw new Error('not allowed')
    }
    return await db.upsertProduct(input.data, userId)
  },
})

const queries = trpc
  .router<tRPCContext>()
  .query('listTags', {
    input: z.object({
      name: z.string().optional(),
      storeId: z.string().cuid(),
    }),
    resolve: ({ input }) => db.getTags(input),
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
      const store = await db.getStore({ slug: input.storeSlug })
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
      const store = await db.getStore({ slug: input.storeSlug })
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
      return await db.getProductById(input)
    },
  })
  .query('getBySlug', {
    input: z.object({
      storeSlug: z.string(),
      productSlug: z.string(),
    }),
    resolve: async ({ input }) => {
      const store = await db.getStore({ slug: input.storeSlug })
      if (!store) {
        return null
      }
      return await db.getProductBySlug({
        slug: input.productSlug,
        storeId: store.id,
      })
    },
  })

export default trpc.router<tRPCContext>().merge(mutations).merge(queries)
