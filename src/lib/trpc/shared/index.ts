import type { LayoutType } from '$lib/utils/layout'
import type { RequestEvent } from '@sveltejs/kit'
import { router } from '@trpc/server'

export type tRPCContext = {
  layout: LayoutType
  event: RequestEvent
}

export const createServer = () => router<tRPCContext>()
