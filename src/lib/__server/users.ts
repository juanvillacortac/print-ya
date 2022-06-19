import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import * as z from 'zod'
import type { tRPCContext } from './trpc'

export default trpc.router<tRPCContext>().query('stores', {
  resolve: async ({ ctx }) => {
    const { userId } = await db.getUserDetails(ctx.event)
    return await db.getUserStores({ userId })
  },
})
