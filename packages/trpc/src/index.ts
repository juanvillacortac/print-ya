import './fetch-polyfill.js'

import * as _db from '@shackcart/db'

import trpcTransformer from 'trpc-transformer'
import { createServer } from './shared.js'

import users from './handlers/users.js'
import customers from './handlers/customers.js'
import stores from './handlers/stores.js'
import products from './handlers/products.js'
import orders from './handlers/orders.js'
import analytics from './handlers/analytics.js'
import utils from './handlers/utils.js'
import shopifyImports from './handlers/shopify-imports.js'

import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'

export * from './shared.js'

export const router = createServer()
  .transformer(trpcTransformer)
  .merge('user:', users)
  .merge('stores:', stores)
  .merge('orders:', orders)
  .merge('customer:', customers)
  .merge('analytics:', analytics)
  .merge('products:', products)
  .merge('utils:', utils)
  .merge('shopify:', shopifyImports)

export type tRPCRouter = typeof router

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
