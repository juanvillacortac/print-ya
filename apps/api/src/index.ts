import { getStore } from '@shackcart/db'
import { router, tRPCContext } from '@shackcart/trpc'
import { fastify } from 'fastify'
import session from '@fastify/session'
import cookie from '@fastify/cookie'
import {
  CreateFastifyContextOptions,
  fastifyTRPCPlugin,
} from './trpc-adapter/plugin.js'
import type { inferAsyncReturnType } from '@trpc/server'

async function createContext({
  req,
}: CreateFastifyContextOptions): Promise<tRPCContext> {
  return {
    ip: req.ip,
    session: {
      userId: (req.session as any).userId || undefined,
      customerId: (req.session as any).customerId || undefined,
      setUser: (id: string) => {
        req.session.set('userId', id)
      },
      setCustomer: (id: string) => {
        req.session.set('customerId', id)
      },
      destroy: () => {
        req.session.destroy()
      },
      refresh: () => {
        req.session.touch()
      },
    },
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

const app = async () => {
  const app = fastify({
    logger: true,
  })
  app.register(cookie)
  app.register(session.default, {
    secret: 'bJwDioi1uvqNTPdxC0/RLryHet0+65nNjQibylnkM3S3kavfzp7gPg==',
  })
  app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router, createContext },
  })

  app.get('/', async (req, reply) => {
    reply.send(await getStore({ slug: 'labelshut' }))
  })

  if (import.meta.env.PROD) {
    app.listen({
      port: +import.meta.env.VITE_PORT || 3000,
      host: '0.0.0.0',
    })
  }

  return app
}

export const server = app()
