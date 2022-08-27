import { router } from '@trpc/server'

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

export const createServer = () => router<tRPCContext>()
