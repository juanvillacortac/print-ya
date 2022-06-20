import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import type { tRPCContext } from '.'

const mutations = trpc.router<tRPCContext>().mutation('upsert', {
  input: (input: { storeSlug: string; data: Partial<db.Product> }) => input,
  resolve: async ({ ctx, input }) => {
    const { userId } = await db.getUserDetails(ctx.event)
    return await db.upsertProduct(input.data, userId)
  },
})

const queries = trpc
  .router<tRPCContext>()
  .query('list', {
    input: (input: { storeSlug: string }) => input,
    resolve: async ({ input }) => {
      const store = await db.getStoreBySlugOrHost({ slug: input.storeSlug })
      if (!store) {
        return null
      }
      return await db.getProductsByStore({ storeId: store.id })
    },
  })
  .query('getBySlug', {
    input: (input: { productSlug: string; storeSlug: string }) => input,
    resolve: async ({ input }) => {
      const store = await db.getStoreBySlugOrHost({ slug: input.storeSlug })
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
