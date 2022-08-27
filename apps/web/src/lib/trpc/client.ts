import { invalidate } from '$app/navigation'
import type { QueryKey, tRPCRouter } from '@shackcart/trpc'
import { createTRPCClient } from '@trpc/client'
import trpcTransformer from 'trpc-transformer'
import type { LoadEvent } from '@sveltejs/kit'

const trpc = (fetch?: LoadEvent['fetch']) => {
  return createTRPCClient<tRPCRouter>({
    url: `/api/trpc`,
    transformer: trpcTransformer,
    fetch: fetch as any,
  })
}

export default trpc

export const invalidateQuery = (...keys: Exclude<QueryKey, symbol>[]) =>
  invalidate((href) => keys.some((key) => href.includes(`/api/trpc/${key}`)))
