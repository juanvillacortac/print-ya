import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

const mutations = trpc.router<tRPCContext>().mutation('create', {
  input: z.object({
    order: z.object({
      paymentMethods: z.array(z.string()),
      items: z.array(
        z.object({
          productId: z.string(),
          modifiers: z.any(),
          quantity: z.number().min(1),
        })
      ),
      fees: z.array(
        z.object({
          name: z.string(),
          fixed: z.number(),
          percentage: z.number(),
        })
      ),
    }),
    storeId: z.string().cuid(),
  }),
  resolve: async ({ input }) =>
    db.createOrder({
      order: input.order,
      storeId: input.storeId,
    }),
})

const queries = trpc
  .router<tRPCContext>()
  .query('list', {
    input: z.object({
      storeId: z.string().cuid(),
    }),
    resolve: ({ input }) => db.getOrdersByStore(input),
  })
  .query('get', {
    input: z.object({
      orderId: z.string().cuid(),
    }),
    resolve: async ({ input }) => db.getOrder(input.orderId),
  })

export default trpc.router<tRPCContext>().merge(mutations).merge(queries)
