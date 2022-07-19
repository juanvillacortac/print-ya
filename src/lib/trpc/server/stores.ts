import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { z } from 'zod'
import type { tRPCContext } from '.'

const mutations = trpc
  .router<tRPCContext>()
  .middleware(async ({ ctx, next }) => {
    const { userId } = await db.getUserDetails(ctx.event)
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next()
  })
  .mutation('upsertCategory', {
    input: z.object({
      id: z.string(),
      name: z.string(),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ ctx, input }) => {
      const userId = (await db.getUserDetails(ctx.event)).userId!
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
      const userId = (await db.getUserDetails(ctx.event)).userId!
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
    resolve: ({ input }) => db.getStore({ slug: input }),
  })
  .query('getByHost', {
    input: z.string(),
    resolve: ({ input }) => db.getStore({ host: input }),
  })

const payment = trpc.router<tRPCContext>().mutation('createStripeIntent', {
  input: z.object({
    currency: z.string().min(3).max(3),
    amount: z.number().min(0.5),
  }),
  output: z.string().nullable().describe('Stripe payment intent client secret'),
  resolve: async ({ input: { amount, currency } }) => {
    const stripe = new Stripe(
      'sk_test_51I7RL6J2WplztltUOlXaPetKyPuxBVvltv3Sw1saE28kDZRUBHiabRq4x4CifO8szv41kI8ed5zYp6de3Be36tZ200UiY7OksM',
      {
        // @ts-ignore
        apiVersion: null,
        typescript: true,
      }
    )

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.trunc(amount * 100),
        currency,
        payment_method_types: ['card'],
      })
      return paymentIntent.client_secret
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }
  },
})

export default trpc
  .router<tRPCContext>()
  .merge(mutations)
  .merge(queries)
  .merge('payment:', payment)
