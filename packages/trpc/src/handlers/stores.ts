import * as db from '@shackcart/db'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import { marked } from 'marked'
import { createServer } from '../shared.js'
import type { StoreData } from '@shackcart/db'

const redis = new Redis({
  url: process.env.PUBLIC_UPSTASH_REDIS_URL || '',
  token: process.env.PUBLIC_UPSTASH_REDIS_TOKEN || '',
})

const mutations = createServer()
  .middleware(async ({ ctx, next }) => {
    const { userId } = await ctx.session.auth({ verify: true })
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        ...ctx,
        userId,
      },
    })
  })
  .mutation('upsert', {
    input: (input: unknown) => input as Partial<db.Store>,
    resolve: async ({ ctx, input }) => {
      const { userId } = ctx
      const store = await db.upsertStore(input, userId)
      return store
    },
  })

const queries = createServer()
  .query('getBySlug', {
    input: z.string(),
    resolve: async ({ input }) => {
      const store = await db.getStore({ slug: input })
      const storeData = store
        ? await (
            await redis.get<{ json: StoreData }>(`storeData:${store.id}`)
          )?.json
        : undefined
      return {
        store,
        storeData,
        // storeData: {} as StoreData,
      }
    },
  })
  .query('getByHost', {
    input: z.string(),
    resolve: async ({ input }) => {
      const store = await db.getStore({ host: input })
      const storeData = store
        ? await (
            await redis.get<{ json: StoreData }>(`storeData:${store.id}`)
          )?.json
        : undefined
      return {
        store,
        storeData,
        // storeData: {} as StoreData,
      }
    },
  })

const payment = createServer()
  .mutation('createStripeIntent', {
    input: z.object({
      currency: z.string().min(3).max(3),
      amount: z.number().min(0.5),
      storeId: z.string(),
    }),
    output: z
      .string()
      .nullable()
      .describe('Stripe payment intent client secret'),
    resolve: async ({ input: { amount, currency, storeId } }) => {
      const key = await redis.get<string>(`store:${storeId}:stripe:private`)
      const stripe = new Stripe(
        key || '',
        // 'sk_test_51I7RL6J2WplztltUOlXaPetKyPuxBVvltv3Sw1saE28kDZRUBHiabRq4x4CifO8szv41kI8ed5zYp6de3Be36tZ200UiY7OksM',
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
  .mutation('setGatewaysCredentials', {
    input: z.object({
      storeId: z.string(),
      stripe: z
        .object({
          publicKey: z.string().optional(),
          privateKey: z.string().optional(),
        })
        .optional(),
      paypal: z
        .object({
          clientId: z.string().optional(),
        })
        .optional(),
    }),
    resolve: async ({ input: { storeId, paypal, stripe } }) => {
      if (stripe?.publicKey) {
        await redis.set<string>(
          `store:${storeId}:stripe:public`,
          stripe.publicKey
        )
      }
      if (stripe?.privateKey) {
        await redis.set<string>(
          `store:${storeId}:stripe:private`,
          stripe.privateKey
        )
      }
      if (paypal?.clientId) {
        await redis.set<string>(
          `store:${storeId}:paypal:clientId`,
          paypal.clientId
        )
      }
      return {
        ok: true,
      }
    },
  })
  .query('gatewaysPublicCredentials', {
    input: z.string({ description: 'Store Id' }),
    resolve: async ({ input }) => {
      const stripePublicKey = await redis.get<string>(
        `store:${input}:stripe:public`
      )
      const paypalClientId = await redis.get<string>(
        `store:${input}:paypal:clientId`
      )
      return {
        stripe: {
          publicKey: stripePublicKey,
        },
        paypal: {
          clientId: paypalClientId,
        },
      }
    },
  })

export default createServer()
  .merge(mutations)
  .merge(queries)
  .merge('payment:', payment)
  .mutation('marketing:sendContactEmail', {
    input: z.object({
      storeId: z.string().cuid(),
      name: z.string(),
      phone: z.string(),
      email: z.string().email(),
      message: z.string(),
    }),
    resolve: async ({ input }) => {
      try {
        sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
        const store = await db.getStore({ id: input.storeId })
        if (!store) {
          return { ok: false }
        }
        let template =
          (
            await redis.get<{ json: string }>(
              `contactEmailTemplate:${input.storeId}`
            )
          )?.json ||
          `**You've got a new message from {{name}}, their email is [{{email}}](mailto:{{email}}) and their phone number is [{{phone}}](tel:{{phone}})**

### Message:

{{message}}`

        if (template) {
          template = template.replace(new RegExp('{{email}}', 'g'), input.email)
          template = template.replace(new RegExp('{{phone}}', 'g'), input.phone)
          template = template.replace(new RegExp('{{name}}', 'g'), input.name)
          template = template.replace(
            new RegExp('{{message}}', 'g'),
            input.message
          )
        }

        const html = marked(template, {
          sanitize: true,
        })

        let to = [(await db.getUser({ userId: store.userId }))!.email]
        if (store.contactData && (store.contactData as any)?.email) {
          to.push((store.contactData as any)?.email)
        }

        const msg: MailDataRequired = {
          to: [...new Set(to)],
          from: {
            name: `${input.name} via ${store.name}`,
            email: `${store.slug}@shackcart.com`,
          },
          replyTo: input.email,

          headers: {
            Priority: 'Urgent',
            Importance: 'high',
          },
          subject: `[New contact form message] ${input.name}`,
          html,
        }
        await sendgrid.send(msg)
        return { ok: true }
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        })
      }
    },
  })
