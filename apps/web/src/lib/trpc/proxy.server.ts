import type { Handle, RequestEvent } from '@sveltejs/kit'
import type { AnyRouter } from '@trpc/server'

type resolveHandler = Parameters<Handle>[0]['resolve']

/**
 * A function that creates a tRPC handle.
 * @see https://kit.svelte.dev/docs/hooks
 */
export async function createTRPCProxy<T extends AnyRouter>(
  {
    event,
    prefix = '/api/trpc',
    resolve,
    cache,
    url,
    headers: headersInit,
  }: {
    url: string
    prefix?: string
    headers?: HeadersInit
    cache?: {
      enable?: boolean
      privateQueries:
        | string[]
        | Exclude<keyof T['_def']['queries'], symbol | number>[]
    }
    event: RequestEvent
    resolve: resolveHandler
  },
  resolveOptions?: Parameters<resolveHandler>[1]
): Promise<{ response: Response; isTRPC: boolean }> {
  let response: Response
  let isTRPC = event.url.pathname.startsWith(`${prefix}/`)
  if (!prefix.startsWith('/') || prefix.endsWith('/')) {
    throw new Error("The tRPC url must start with '/' and NOT end with '/'")
  }

  if (isTRPC) {
    const query = event.url.pathname.substring(prefix.length + 1)
    const dst = new URL(`${url}/${query}?${event.url.searchParams}`)
    const apiResponse = await fetch(dst, {
      headers: headersInit,
      method: event.request.method,
      body:
        event.request.method != 'GET' ? await event.request.text() : undefined,
    })

    const { body, headers, status } = apiResponse.clone()

    const isPublic =
      !cache?.privateQueries.some((path) => query.startsWith(path)) &&
      event.request.method == 'GET'

    response = new Response(body, { headers, status })

    if (cache?.enable && isPublic) {
      response.headers.set(
        'cache-control',
        's-maxage=1, stale-while-revalidate'
      )
    }
  } else {
    response = await resolve(event, resolveOptions)
  }
  return { response, isTRPC }
}
