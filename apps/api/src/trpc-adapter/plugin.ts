import type { AnyRouter } from '@trpc/server'
import type { NodeHTTPCreateContextFnOptions } from '@trpc/server/dist/declarations/src/adapters/node-http/types.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyHandlerOptions, fastifyRequestHandler } from './handler.js'

export interface FastifyTRPCPluginOptions<TRouter extends AnyRouter> {
  prefix?: string
  trpcOptions: FastifyHandlerOptions<TRouter, FastifyRequest, FastifyReply>
}

export type CreateFastifyContextOptions = NodeHTTPCreateContextFnOptions<
  FastifyRequest,
  FastifyReply
>

export function fastifyTRPCPlugin<TRouter extends AnyRouter>(
  fastify: FastifyInstance,
  opts: FastifyTRPCPluginOptions<TRouter>,
  done: (err?: Error) => void
) {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    function (_, body, _done) {
      _done(null, body)
    }
  )

  let prefix = opts.prefix ?? ''

  // https://github.com/fastify/fastify-plugin/blob/fe079bef6557a83794bf437e14b9b9edb8a74104/plugin.js#L11
  // @ts-expect-error property 'default' does not exists on type ...
  if (typeof fastifyTRPCPlugin.default !== 'function') {
    prefix = '' // handled by fastify internally
  }

  fastify.all(`${prefix}/:path`, async (req, res) => {
    const path = (req.params as any).path
    await fastifyRequestHandler({ ...opts.trpcOptions, req, res, path })
  })

  done()
}
