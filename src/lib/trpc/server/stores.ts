import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

const mutations = trpc.router<tRPCContext>().mutation('upsert', {
  input: (input: db.Store) => input,
  resolve: async ({ ctx, input }) => {
    const { userId } = await db.getUserDetails(ctx.event)
    if (!userId) {
      throw new Error('not allowed')
    }
    const store = await db.upsertStore(input, userId)
    return store
  },
})

const queries = trpc
  .router<tRPCContext>()
  .query('getBySlug', {
    input: z.string(),
    resolve: ({ input }) => db.getStoreBySlugOrHost({ slug: input }),
  })
  .query('getByHost', {
    input: z.string(),
    resolve: ({ input }) => db.getStoreBySlugOrHost({ host: input }),
  })

export default trpc.router<tRPCContext>().merge(mutations).merge(queries)
