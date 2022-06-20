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
      email: z.string().email(),
      password: z.string().min(6),
    }),
    resolve: async ({ ctx, input: { email, password } }) => {
      try {
        const { body } = await db.login({
          email,
          password,
          isLogin: false,
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
  .mutation('login', {
    input: z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
    resolve: async ({ ctx, input: { email, password } }) => {
      try {
        const { body } = await db.login({
          email,
          password,
          isLogin: true,
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
  .query('stores', {
    resolve: async ({ ctx }) => {
      const { userId } = await db.getUserDetails(ctx.event)
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged',
        })
      }
      return await db.getUserStores({ userId })
    },
  })