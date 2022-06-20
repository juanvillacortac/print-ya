import type { tRPCRouter } from '$lib/trpc/server'
import { browser } from '$app/env'
import { createTRPCClient } from '@trpc/client'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import trpcTransformer from 'trpc-transformer'
import { getAbsoluteURL } from '../utils/host'

const trpc = (loadFetch?: typeof fetch) => {
  return createTRPCClient<tRPCRouter>({
    url: '/api/trpc',
    transformer: trpcTransformer,
    ...(loadFetch && { fetch: loadFetch }),
  })
}

export default trpc

type Query = keyof tRPCRouter['_def']['queries']
type Mutation = keyof tRPCRouter['_def']['mutations']

export type InferQueryOutput<RouteKey extends Query> = inferProcedureOutput<
  tRPCRouter['_def']['queries'][RouteKey]
>
export type InferQueryInput<RouteKey extends Query> = inferProcedureInput<
  tRPCRouter['_def']['queries'][RouteKey]
>
export type InferMutationOutput<RouteKey extends Mutation> =
  inferProcedureOutput<tRPCRouter['_def']['mutations'][RouteKey]>
export type InferMutationInput<RouteKey extends Mutation> = inferProcedureInput<
  tRPCRouter['_def']['mutations'][RouteKey]
>
