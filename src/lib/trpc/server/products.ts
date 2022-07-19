import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

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
  .query('list', {
    input: z.object({
      storeSlug: z.string(),
      public: z.boolean().optional(),
    }),
    resolve: async ({ input }) => {
      const store = await db.getStore({ slug: input.storeSlug })
      if (!store) {
        return []
      }
      return await db.getProductsByStore({
        storeId: store.id,
        published: input.public,
        archived: false,
      })
    },
  })
  .query('listDeleted', {
    input: z.object({
      storeSlug: z.string(),
    }),
    resolve: async ({ input }) => {
      const store = await db.getStore({ slug: input.storeSlug })
      if (!store) {
        return []
      }
      return await db.getProductsByStore({
        storeId: store.id,
        archived: true,
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
