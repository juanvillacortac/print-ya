import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'
import { get } from '$lib/api'
import sendgrid from '@sendgrid/mail'
import { getAbsoluteURL } from '$lib/utils/host'

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
      let coords: any
      if (!input.order.billingData?.coords) {
        const geo = await get(`https://ipwho.is/${ctx.event.clientAddress}`)
        if (geo) {
          coords = {
            latitude: geo.latitude,
            longitude: geo.longitude,
          }
        }
      }
      return db.createOrder({
        order: {
          ...input.order,
          billingData: {
            ip: ctx.event.clientAddress,
            ...input.order.billingData,
            coords: coords ? coords : input.order.billingData?.coords,
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
    resolve: async ({ input }) => {
      if (input.status === 'paid') {
        sendgrid.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY)
        const order = await db.getOrder(input.id)
        if (!order) {
          return null
        }
        const store = await db.getStore({ id: order.storeId })
        if (!store) {
          return null
        }
        let recipient = order.billingData.email
        if (order.customer) {
          recipient = order.customer.email
        }
        const orderUrl = getAbsoluteURL({
          path: `/account/orders/${order.id}`,
          subdomain: !store.customDomain ? store.slug : undefined,
          host: store.customDomain || undefined,
        })
        const ordersUrl = getAbsoluteURL({
          path: `/account/orders`,
          subdomain: !store.customDomain ? store.slug : undefined,
          host: store.customDomain || undefined,
        })
        const html = `<p><strong>Hello, ${
          order.customer?.firstName || order.billingData.firstName
        }</strong></p>
<p>Thank you for placing an order on <strong>${store.name}</strong></p>
<p>We've successfully received your order <a href="${orderUrl}">#${
          order.id
        }</a></p>
<p>To view the status of this order, visit <a href="${orderUrl}">the order page</a>.</p>
<p>Manage your orders <a href="${ordersUrl}">here</a>.</p>`
        const msg = {
          to: recipient,
          from: `${store.slug}@shackcart.com`,
          subject: `Order #${order.id} | Thanks for shopping with us!`,
          html,
        }
        await sendgrid.send(msg)
      }
      return await db.updateOrder(input)
    },
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
          customerId: z.string().cuid().optional(),
          status: z.array(orderStatus).optional(),
          fulfillmentStatus: z.array(fulfillmentStatus).optional(),
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
