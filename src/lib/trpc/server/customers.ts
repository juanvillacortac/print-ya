import * as db from '$lib/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createServer } from '../shared'

const order = z.enum(['desc', 'asc'])

export default createServer()
  .mutation('logout', {
    resolve: async ({ ctx: { event } }) => {
      return await event.locals.session.destroy()
    },
  })
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
      try {
        const { body } = await db.registerCustomer(input)
        await ctx.event.locals.session.set({
          customerId: body.customerId,
        })
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
        await ctx.event.locals.session.refresh()
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
        await ctx.event.locals.session.set({
          customerId: body.customerId,
        })
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
      const { customerId } = await db.getCustomerDetails(ctx.event)
      if (!customerId) return null
      return await db.getCustomer({ customerId: customerId })
    },
  })
