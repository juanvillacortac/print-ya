import type { LayoutType } from '$lib/utils/layout'
import type { Handle, RequestEvent } from '@sveltejs/kit/types'
import * as trpc from '@trpc/server'
import users from './users'
import stores from './stores'
import trpcTransformer from 'trpc-transformer'
import products from './products'
import orders from './orders'
import utils from './utils'

export type tRPCContext = {
  layout: LayoutType
  event: RequestEvent
}

export const router = trpc
  .router<tRPCContext>()
  .transformer(trpcTransformer)
  .merge('user:', users)
  .merge('stores:', stores)
  .merge('products:', products)
  .merge('orders:', orders)
  .merge('utils:', utils)

export type tRPCRouter = typeof router
