import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

export default trpc
  .router<tRPCContext>()
  .mutation('logout', {
    resolve: async ({ ctx: { event } }) => {
      event.locals.session.destroy()
    },
  })
  .mutation('register', {
    input: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ ctx, input }) => {
      try {
        const { body } = await db.registerCustomer(input)
        ctx.event.locals.session.data = body
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
        ctx.event.locals.session.data = body
      } catch (err) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: err.error,
        })
      }
    },
  })
  .query('whoami', {
    resolve: async ({ ctx }) => {
      const { customerId } = await db.getCustomerDetails(ctx.event)
      if (!customerId) return null
      return await db.getCustomer({ customerId: customerId })
    },
  })
