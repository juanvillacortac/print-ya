import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'
import { get } from '$lib/api'

const orderStatus = z.enum(['paid', 'processing', 'pending'])
const fulfillmentStatus = z.enum([
  'fulfilled',
  'unfulfilled',
  'partially_fulfilled',
  'awaiting_shipment',
  'scheduled',
  'on_hold',
])

const mutations = trpc
  .router<tRPCContext>()
  .mutation('create', {
    input: z.object({
      order: z.object({
        paymentMethods: z.array(z.string()),
        status: orderStatus,
        customerId: z.string().optional(),
        billingData: z.any(),
        items: z.array(
          z.object({
            productId: z.string(),
            modifiers: z.any(),
            fulfilled: z.number().min(0).optional(),
            quantity: z.number().min(1),
            cost: z.number().min(0),
            basePrice: z.number().min(0),
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
    resolve: async ({ input, ctx }) => {
      const geo = await get(`https://ipwho.is/${ctx.event.clientAddress}`)
      return db.createOrder({
        order: {
          ...input.order,
          billingData: {
            ...input.order.billingData,
            geo: geo?.success ? geo : undefined,
          },
        },
        storeId: input.storeId,
      })
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string(),
      paymentMethods: z.array(z.string()).optional(),
      status: orderStatus.optional(),
      billingData: z.any().optional(),
      shippingData: z.any().optional(),
      fulfillmentStatus: fulfillmentStatus.optional(),
      items: z
        .array(
          z.object({
            productId: z.string(),
            modifiers: z.any(),
            cost: z.number().min(0),
            basePrice: z.number().min(0),
            fulfilled: z.number().min(0).optional(),
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

const order = z.enum(['desc', 'asc'])

const queries = trpc
  .router<tRPCContext>()
  .query('list', {
    input: z.object({
      storeId: z.string().cuid(),
      filter: z
        .object({
          id: z.string().optional(),
          status: orderStatus.optional(),
          fulfillmentStatus: fulfillmentStatus.optional(),
        })
        .optional(),
      orderBy: z
        .object({
          id: order.optional(),
          createdAt: order.optional(),
          total: order.optional(),
        })
        .optional(),
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
