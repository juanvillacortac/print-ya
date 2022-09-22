import { invalidate } from '$app/navigation'
import type { QueryKey, tRPCRouter } from '@shackcart/trpc'
import trpcTransformer from 'trpc-transformer'
import type { LoadEvent } from '@sveltejs/kit'
import { createTRPCClient } from '@trpc/client'

function trpc(fetch?: LoadEvent['fetch'], server?: boolean, token?: string) {
  return createTRPCClient<tRPCRouter>({
    url: server ? `${__API_URL__}/trpc` : `/api/trpc`,
    transformer: trpcTransformer,
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
    fetch: fetch as any,
  })
}

export default trpc

export const invalidateQuery = (...keys: Exclude<QueryKey, symbol>[]) =>
  invalidate((href) =>
    keys.some((key) => href.pathname.includes(`/api/trpc/${key}`))
  )
