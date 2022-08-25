import * as db from '@shackcart/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createServer } from '../shared.js'

export default createServer()
  .mutation('logout', {
    resolve: async ({ ctx }) => {
      return await ctx.session.destroy()
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
        await ctx.session.setUser(body.userId)
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
    }),
    resolve: async ({ ctx, input: { email, password } }) => {
      try {
        const { body } = await db.login({
          email,
          password,
          isLogin: true,
        })
        await ctx.session.setUser(body.userId)
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
      const { userId } = ctx.session
      if (!userId) return null
      return await db.getUser({ userId: userId || '' })
    },
  })
  .query('stores', {
    resolve: async ({ ctx }) => {
      const { userId } = ctx.session
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged',
        })
      }
      return await db.getUserStores({ userId })
    },
  })