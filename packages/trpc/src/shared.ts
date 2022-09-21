import { router } from '@trpc/server'
import { Redis } from '@upstash/redis'

export type tRPCContext = {
  session: {
    setUser: (id: string) => Promise<string>
    setCustomer: (id: string) => Promise<string>
    auth: (
      options?: Partial<Record<'verify', boolean>>
    ) => Promise<Partial<Record<'userId' | 'customerId', string>>>
  }
  ip: string
}

export const createServer = () =>
  router<tRPCContext>().middleware(async ({ ctx, next }) => {
    const redis = new Redis({
      url: process.env.PUBLIC_UPSTASH_REDIS_URL || '',
      token: process.env.PUBLIC_UPSTASH_REDIS_TOKEN || '',
    })
    return next({
      ctx: {
        ...ctx,
        redis,
      },
    })
  })
