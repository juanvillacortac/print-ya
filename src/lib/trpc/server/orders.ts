import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

const orderStatus = z.enum(['paid', 'processing', 'pending'])

const mutations = trpc
  .router<tRPCContext>()
  .mutation('create', {
    input: z.object({
      order: z.object({
        paymentMethods: z.array(z.string()),
        status: orderStatus,
        customerId: z.string().optional(),
        billingData: z.any().optional(),
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
  .mutation('update', {
    input: z.object({
      id: z.string(),
      paymentMethods: z.array(z.string()).optional(),
      status: orderStatus.optional(),
      billingData: z.any().optional(),
      items: z
        .array(
          z.object({
            productId: z.string(),
            modifiers: z.any(),
            quantity: z.number().min(1),
          })
        )
        .optional(),
      fees: z
        .array(
          z.object({
            name: z.string(),
            fixed: z.number(),
            percentage: z.number(),
          })
        )
        .optional(),
    }),
    resolve: async ({ input }) => db.updateOrder(input),
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
      orderId: z.string(),
    }),
    resolve: async ({ input }) => db.getOrder(input.orderId),
  })

export default trpc.router<tRPCContext>().merge(mutations).merge(queries)
