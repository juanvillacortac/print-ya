import type { Handle, RequestEvent } from '@sveltejs/kit'
import {
  resolveHTTPResponse,
  type AnyRouter,
  type Dict,
  type inferRouterContext,
  type inferRouterError,
  type ProcedureType,
  type ResponseMeta,
  type TRPCError,
} from '@trpc/server'
import type { TRPCResponse } from '@trpc/server/rpc'

export type CreateContextFn<TRouter extends AnyRouter> = (
  event: RequestEvent
) => Promise<inferRouterContext<TRouter>>

export type ResponseMetaFn<TRouter extends AnyRouter> = (opts: {
  data: TRPCResponse<unknown, inferRouterError<TRouter>>[]
  ctx?: inferRouterContext<TRouter>
  paths?: string[]
  type: ProcedureType | 'unknown'
  errors: TRPCError[]
}) => ResponseMeta

type resolveHandler = Parameters<Handle>[0]['resolve']

/**
 * A function that creates a tRPC handle.
 * @see https://kit.svelte.dev/docs/hooks
 */
export async function createTRPCHandle<Router extends AnyRouter>(
  {
    url = '/trpc',
    router,
    createContext,
    responseMeta,
    event,
    resolve,
  }: {
    /**
     * The URL prefix of tRPC routes.
     * Must start with `/` and NOT end with `/`.
     * Requests starting with this prefix will be intercepted and handled by tRPC,
     * and will NOT be forwarded to SvelteKit.
     * @default '/trpc' */
    url?: string

    /**
     * The tRPC router
     * @see https://trpc.io/docs/router */
    router: Router

    /**
     * A function called for each request, whose result is propagated to all resolvers.
     * You can use this to pass contextual data down to the resolvers.
     * @see https://trpc.io/docs/context */
    createContext?: CreateContextFn<Router>

    /**
     * A function allowing you to override/customize the response status and headers
     * (i.e. to control caching).
     * @see https://trpc.io/docs/caching */
    responseMeta?: ResponseMetaFn<Router>

    /**
     * The event object passed to the `handle` function.
     * @see https://kit.svelte.dev/docs/hooks#handle */
    event: RequestEvent

    /**
     * The resolve object passed to the `handle` function.
     * @see https://kit.svelte.dev/docs/hooks#handle */
    resolve: resolveHandler
  },
  resolveOptions?: Parameters<resolveHandler>[1]
): Promise<{ response: Response; trpc: boolean }> {
  if (!url.startsWith('/') || url.endsWith('/')) {
    throw new Error("The tRPC url must start with '/' and NOT end with '/'")
  }

  if (event.url.pathname.startsWith(`${url}/`)) {
    const request = event.request as Request & {
      headers: Dict<string | string[]>
    }

    const req = {
      method: request.method,
      headers: request.headers,
      query: event.url.searchParams,
      body: await request.text(),
    }

    const httpResponse = await resolveHTTPResponse({
      router,
      req,
      path: event.url.pathname.substring(url.length + 1),
      createContext: async () => createContext?.(event),
      responseMeta,
    })

    const { status, headers, body } = httpResponse as {
      status: number
      headers: Record<string, string>
      body: string
    }

    return { response: new Response(body, { status, headers }), trpc: true }
  } else {
    return { response: await resolve(event, resolveOptions), trpc: false }
  }
}
