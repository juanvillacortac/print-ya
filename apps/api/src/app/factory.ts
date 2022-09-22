import { router, tRPCContext } from '@shackcart/trpc'
import cookie from '@fastify/cookie'
import { default as cors } from '@fastify/cors'
import { default as jwt } from '@fastify/jwt'
import {
  CreateFastifyContextOptions,
  fastifyTRPCPlugin,
} from '../trpc-adapter/plugin.js'
import { Application } from './index.js'

/** Define a factory function that will create an instance of `Application` */
export type ApplicationFactory = typeof applicationFactory

/** Create an new instance of `Application` */
export async function applicationFactory(worker: number = 0) {
  // Application instance
  const app = new Application(
    { port: +import.meta.env.VITE_PORT || 3000, host: '0.0.0.0' },
    {
      logger: import.meta.env.PROD,
    }
  )

  app.$server.register(cors, {
    credentials: true,
    origin: true,
  })
  app.$server.register(cookie, {
    secret: 'bJwDioi1uvqNTPdxC0/RLryHet0+65nNjQibylnkM3S3kavfzp7gPg==',
  })
  app.$server.register(jwt, {
    secret: 'bJwDioi1uvqNTPdxC0/RLryHet0+65nNjQibylnkM3S3kavfzp7gPg==',
    cookie: {
      cookieName: 'jwt',
      signed: true,
    },
    sign: {
      expiresIn: '10d',
    },
  })

  app.$server.get('/pid', async (req, res) => {
    res.send({ pid: process.pid })
  })

  app.$server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router,
      createContext: async ({
        req,
        res,
      }: CreateFastifyContextOptions): Promise<tRPCContext> => {
        return {
          ip: req.ip,
          session: {
            auth: async (options) => {
              let ids: Partial<Record<'userId' | 'customerId', string>> = {}
              let decoded: any
              try {
                decoded = await req.jwtVerify()
              } catch (err) {
                if (
                  !err.code ||
                  (options?.verify && err.code.startsWith('FST_JWT'))
                )
                  throw err
              }
              if (decoded?.id && decoded?.type) {
                ids[decoded.type === 'user' ? 'userId' : 'customerId'] =
                  decoded.id
              }
              return ids
            },
            setUser: async (id: string) => {
              const token = await res.jwtSign({ id, type: 'user' })
              res.header('x-access-token', token)
              return token
            },
            setCustomer: async (id: string) => {
              const token = await res.jwtSign({ id, type: 'customer' })
              res.header('x-access-token', token)
              return token
            },
          },
        }
      },
    },
  })

  const url = await app.listen()
  console.log('🚀 Server ready at %s on worker %o', url, process.pid)

  return app.$server
}

// const app = async () => {
//   const app = fastify({})

//   app.register(cors, {
//     credentials: true,
//     origin: true,
//   })
//   app.register(cookie, {
//     secret: 'bJwDioi1uvqNTPdxC0/RLryHet0+65nNjQibylnkM3S3kavfzp7gPg==',
//   })
//   app.register(jwt, {
//     secret: 'bJwDioi1uvqNTPdxC0/RLryHet0+65nNjQibylnkM3S3kavfzp7gPg==',
//     cookie: {
//       cookieName: 'jwt',
//       signed: true,
//     },
//     sign: {
//       expiresIn: '10d',
//     },
//   })

//   app.register(fastifyTRPCPlugin, {
//     prefix: '/trpc',
//     trpcOptions: {
//       router,
//       createContext: async ({
//         req,
//         res,
//       }: CreateFastifyContextOptions): Promise<tRPCContext> => {
//         return {
//           ip: req.ip,
//           session: {
//             auth: async (options) => {
//               let ids: Partial<Record<'userId' | 'customerId', string>> = {}
//               let decoded: any
//               try {
//                 decoded = await req.jwtVerify()
//               } catch (err) {
//                 if (
//                   !err.code ||
//                   (options?.verify && err.code.startsWith('FST_JWT'))
//                 )
//                   throw err
//               }
//               if (decoded?.id && decoded?.type) {
//                 ids[decoded.type === 'user' ? 'userId' : 'customerId'] =
//                   decoded.id
//               }
//               return ids
//             },
//             setUser: async (id: string) => {
//               const token = await res.jwtSign({ id, type: 'user' })
//               res.header('x-access-token', token)
//               return token
//             },
//             setCustomer: async (id: string) => {
//               const token = await res.jwtSign({ id, type: 'customer' })
//               res.header('x-access-token', token)
//               return token
//             },
//           },
//         }
//       },
//     },
//   })

//   app.get('/', async (req, res) => {
//     const user = await login({
//       email: 'juanvillacortac@gmail.com',
//       password: '123456',
//       isLogin: true,
//     })
//     if (!user) return
//     const token = await res.jwtSign({ id: user.body.userId, type: 'user' })
//     res
//       .setCookie('jwt', token, {
//         domain: req.hostname.split(':')[0],
//         secure: false,
//         signed: true,
//         httpOnly: true,
//         sameSite: 'lax',
//       })
//       .send({ token })
//   })

//   if (import.meta.env.PROD) {
//     const port = +import.meta.env.VITE_PORT || 3000
//     app.listen({
//       port,
//       host: '0.0.0.0',
//     })

//     app.ready((err: Error) => {
//       if (err) {
//         app.log.error(err)
//         process.exit(1)
//       }

//       app.log.info(`Server listening on port ${port}`)
//     })
//   }

//   return app
// }
