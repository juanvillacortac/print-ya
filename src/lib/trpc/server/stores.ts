import * as db from '$lib/db'
import type { StoreCategory } from '@prisma/client'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { toZod } from 'tozod'
import type { tRPCContext } from '.'

const mutations = trpc
  .router<tRPCContext>()
  .mutation('upsertCategory', {
    input: z.object({
      id: z.string(),
      name: z.string(),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ ctx, input }) => {
      const { userId } = await db.getUserDetails(ctx.event)
      if (!userId) {
        throw new Error('not allowed')
      }
      const store = await (
        await db.getUserStores({ userId })
      ).find((s) => s.id === input.storeId)
      if (!store) {
        throw new Error('not allowed')
      }
      return await db.upsertStoreCategory(input)
    },
  })
  .mutation('upsert', {
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
