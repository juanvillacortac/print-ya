import type { LayoutType } from '$lib/utils/layout'
import type { RequestEvent } from '@sveltejs/kit/types/private'
import * as trpc from '@trpc/server'
import users from './users'
import stores from './stores'
import trpcTransformer from 'trpc-transformer'
import products from './products'

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

export type Router = typeof router
