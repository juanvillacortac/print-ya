import { browser } from '$app/env'
import type { Router } from '$lib/__server/trpc'
import * as trpc from '@trpc/client'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import trpcTransformer from 'trpc-transformer'
import { getAbsoluteURL } from './utils/host'

const url = browser ? '/api/trpc' : getAbsoluteURL({ path: '/api/trpc' })

export default (loadFetch?: typeof fetch, host?: string) =>
  trpc.createTRPCClient<Router>({
    url: getAbsoluteURL({ path: '/api/trpc', host }),
    transformer: trpcTransformer,
    ...(loadFetch && { fetch: loadFetch }),
  })

type Query = keyof Router['_def']['queries']
type Mutation = keyof Router['_def']['mutations']

export type InferQueryOutput<RouteKey extends Query> = inferProcedureOutput<
  Router['_def']['queries'][RouteKey]
>
export type InferQueryInput<RouteKey extends Query> = inferProcedureInput<
  Router['_def']['queries'][RouteKey]
>
export type InferMutationOutput<RouteKey extends Mutation> =
  inferProcedureOutput<Router['_def']['mutations'][RouteKey]>
export type InferMutationInput<RouteKey extends Mutation> = inferProcedureInput<
  Router['_def']['mutations'][RouteKey]
>
