import { invalidate } from '$app/navigation'
import type { tRPCRouter } from '$lib/trpc/server'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { createTRPCClient } from '@trpc/client'
import trpcTransformer from 'trpc-transformer'

const trpc = (loadFetch?: typeof fetch) => {
  return createTRPCClient<tRPCRouter>({
    url: '/api/trpc',
    transformer: trpcTransformer,
    ...(loadFetch && { fetch: loadFetch }),
  })
}

export default trpc

export type QueryKey = keyof tRPCRouter['_def']['queries']
export type MutationKey = keyof tRPCRouter['_def']['mutations']

export type InferQueryOutput<RouteKey extends QueryKey> = inferProcedureOutput<
  tRPCRouter['_def']['queries'][RouteKey]
>
export type InferQueryInput<RouteKey extends QueryKey> = inferProcedureInput<
  tRPCRouter['_def']['queries'][RouteKey]
>
export type InferMutationOutput<RouteKey extends MutationKey> =
  inferProcedureOutput<tRPCRouter['_def']['mutations'][RouteKey]>
export type InferMutationInput<RouteKey extends MutationKey> =
  inferProcedureInput<tRPCRouter['_def']['mutations'][RouteKey]>

export const invalidateQuery = (...keys: QueryKey[]) =>
  invalidate((href) => keys.some((key) => href.includes(`/api/trpc/${key}`)))
