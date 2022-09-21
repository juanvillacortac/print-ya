import * as db from '@shackcart/db'
import { utils } from '@shackcart/shared'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createServer } from '../shared.js'
import type { MailDataRequired } from '@sendgrid/mail'
import sendgrid from '@sendgrid/mail'

const order = z.enum(['desc', 'asc'])

const passwordRecovery = createServer()
  .mutation('recoverPassword', {
    input: z.object({
      newPassword: z.string().min(6),
      token: z.string(),
      storeId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
      const { token, newPassword } = input
      const key = `customers:passwordsTokens:${input.storeId}:${token}`
      const email = await ctx.redis.get<string>(key)
      // const email = tokenDB.get(token) || null
      if (!email)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        })
      await db.updateCustomerPassword({
        email,
        newPassword,
        storeId: input.storeId,
      })
      await ctx.redis.del(key)
    },
  })
  .mutation('issuePasswordRecoveryToken', {
    input: z.object({
      email: z.string().email(),
      storeId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
      const store = await db.getStore({
        id: input.storeId,
      })
      const user = await db.prisma.customer.findUnique({
        where: {
          email_storeId: input,
        },
      })
      if (!user || !store) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Account not found',
        })
      }
      const token = crypto
        .randomUUID()
        .replace(new RegExp('-', 'g'), '')
        .toLowerCase()
      console.log(token)
      const key = `customers:passwordsTokens:${input.storeId}:${token}`
      await ctx.redis.set(key, input.email, {
        ex: 86400,
      })
      const url = utils.getAbsoluteURL({
        path: `/login/recover?token=${token}`,
        subdomain: !store?.customDomain ? store?.slug : undefined,
        host: store?.customDomain || undefined,
      })
      const msg: MailDataRequired = {
        to: input.email,
        from: {
          name: `${store.name}`,
          email: `${store.slug}@shackcart.com`,
        },

        headers: {
          Priority: 'Urgent',
          Importance: 'high',
        },
        subject: `Password change`,
        html: `<p><b>Hello, ${user.firstName}</b></p>
          <p>We recently received a request for a forgotten password.</p>
          <p>To change your password, please click on below link</p>
          <p><a href="${url}">Reset your password</a></p>
          <p>If you did not request this change, you do not need to do anything.</p>`,
      }
      await sendgrid.send(msg)
      // tokenDB.set(token, input.email)
    },
  })
  .query('checkPasswordRecoveryToken', {
    input: z.object({
      token: z.string(),
      storeId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
      const key = `customers:passwordsTokens:${input.storeId}:${input.token}`
      const email = await ctx.redis.get<string>(key)
      return { ok: email != null }
    },
  })

export default createServer()
  .merge(passwordRecovery)
  .mutation('register', {
    input: z.object({
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ ctx, input }) => {
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
      try {
        const { body } = await db.registerCustomer(input)
        const store = await db.getStore({ id: input.storeId })

        const loginUrl = utils.getAbsoluteURL({
          path: `/login`,
          subdomain: !store?.customDomain ? store?.slug : undefined,
          host: store?.customDomain || undefined,
        })
        const msg: MailDataRequired = {
          to: input.email,
          from: {
            name: store?.name || 'ShackCart',
            email: `${store?.slug}@shackcart.com`,
          },

          headers: {
            Priority: 'Urgent',
            Importance: 'high',
          },
          subject: `Welcome to ${store?.name}, ${input.firstName}!`,
          html: `<h1>Welcome, ${input.firstName}!</h1>
<p><strong>Your new password is:</strong> ${input.password}</p>
<p>You can login to your new account <a href="${loginUrl}">here</a>.</p>`,
        }
        await sendgrid.send(msg)
        return ctx.session.setCustomer(body.customerId)
      } catch (err) {
        console.error(err.message)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: err.error,
        })
      }
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string().cuid(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional(),
    }),
    resolve: async ({ ctx, input }) => {
      try {
        const customer = await db.modifyCustomer(input)
        return ctx.session.setCustomer(customer.id)
      } catch (err) {
        console.error(err.message)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: err.error,
        })
      }
    },
  })
  .mutation('login', {
    input: z.object({
      email: z.string().email(),
      password: z.string().min(6),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ ctx, input: { email, password, storeId } }) => {
      try {
        const { body } = await db.loginCustomer({
          email,
          password,
          storeId,
        })
        return ctx.session.setCustomer(body.customerId)
      } catch (err) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: err.error,
        })
      }
    },
  })
  .query('list', {
    input: z.object({
      storeId: z.string().cuid(),
      filter: z
        .object({
          name: z.string().optional(),
          email: z.string().email().optional(),
        })
        .optional(),
      orderBy: z
        .object({
          id: order.optional(),
          firstName: order.optional(),
          lastName: order.optional(),
          email: order.optional(),
          createdAt: order.optional(),
        })
        .optional(),
      page: z.number().int().min(1).optional(),
      pageSize: z.number().int().min(1).optional(),
    }),
    resolve: ({ input }) => db.getCustomers(input),
  })
  .query('get', {
    input: z.string().cuid(),
    resolve: async ({ input }) => db.getCustomer({ customerId: input }),
  })
  .query('whoami', {
    resolve: async ({ ctx }) => {
      const { customerId } = await ctx.session.auth()
      if (!customerId) return null
      return await db.getCustomer({ customerId })
    },
  })
