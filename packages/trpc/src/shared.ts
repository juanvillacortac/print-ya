import { router } from '@trpc/server'

export type tRPCContext = {
  session: {
    setUser: (id: string) => void
    setCustomer: (id: string) => void
    destroy: () => void
    refresh: () => void
    userId?: string
    customerId?: string
  }
  ip: string
}

export const createServer = () => router<tRPCContext>()
