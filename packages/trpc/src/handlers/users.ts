import * as db from '@shackcart/db'
import { TRPCError } from '@trpc/server'
import { Redis } from '@upstash/redis'
import { z } from 'zod'
import { createServer } from '../shared.js'
import type { MailDataRequired } from '@sendgrid/mail'
import sendgrid from '@sendgrid/mail'
import { utils } from '@shackcart/shared'

let tokenDB = new Map<string, string>()

export default createServer()
  .mutation('recoverPassword', {
    input: z.object({
      newPassword: z.string().min(6),
      token: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
      const { token, newPassword } = input
      const key = `users:passwordsTokens:${token}`
      const email = await ctx.redis.get<string>(key)
      // const email = tokenDB.get(token) || null
      if (!email)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        })
      await db.updateUserPassword({
        email,
        newPassword,
      })
      await ctx.redis.del(key)
    },
  })
  .mutation('issuePasswordRecoveryToken', {
    input: z.object({
      email: z.string().email(),
    }),
    resolve: async ({ input, ctx }) => {
      const user = await db.prisma.user.findUnique({
        where: input,
      })
      if (!user) {
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
      const key = `users:passwordsTokens:${token}`
      await ctx.redis.set(key, token, {
        ex: 86400,
      })
      const url = utils.getAbsoluteURL({
        path: `/login/recover?token=${token}`,
      })
      const msg: MailDataRequired = {
        to: input.email,
        from: {
          name: 'ShackCart',
          email: `no-reply@shackcart.com`,
        },

        headers: {
          Priority: 'Urgent',
          Importance: 'high',
        },
        subject: `Password change`,
        html: `<p><b>Hello,</b></p>
          <p>ShackCart recently received a request for a forgotten password.</p>
          <p>To change your password, please click on below link</p>
          <p><a href="${url}">Reset your password</a></p>
          <p>If you did not request this change, you do not need to do anything.</p>
          <br>
          <p>Thanks,</p>
          <p>The ShackCart Team</p>`,
      }
      await sendgrid.send(msg)
      // tokenDB.set(token, input.email)
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
        return await ctx.session.setUser(body.userId)
      } catch (err) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: err.error,
        })
      }
    },
  })
  .query('checkPasswordRecoveryToken', {
    input: z.string(),
    resolve: async ({ input, ctx }) => {
      const key = `users:passwordsTokens:${input}`
      const email = await ctx.redis.get<string>(key)
      return { ok: email != null }
    },
  })
  .query('whoami', {
    resolve: async ({ ctx }) => {
      const { userId } = await ctx.session.auth()
      return await db.getUser({ userId: userId || '' })
    },
  })
  .query('stores', {
    resolve: async ({ ctx }) => {
      const { userId } = await ctx.session.auth()
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged',
        })
      }
      return await db.getUserStores({ userId })
    },
  })
