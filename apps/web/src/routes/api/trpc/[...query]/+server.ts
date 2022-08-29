import { PUBLIC_API_URL } from '$env/static/public'
import type { QueryKey } from '@shackcart/trpc'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({
  locals,
  params,
  url,
  request,
  setHeaders,
}) => {
  const { token, layoutType } = locals
  const dst = new URL(
    `${PUBLIC_API_URL}/trpc/${params.query}?${url.searchParams}`
  )
  const response = await fetch(dst, {
    method: request.method,
    body: request.body,
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  })
  const xtoken = response.headers.get('x-token')
  if (xtoken) {
    await locals.session.set({
      token: xtoken,
    })
  }

  const privatePaths: QueryKey[] = [
    'user:whoami',
    'customer:whoami',
    'orders:get',
    'orders:list',
    'customer:get',
    'customer:list',
    'customer:whoami',
  ]

  const isPublic = !privatePaths.some((path) => params.query.startsWith(path))
  if (layoutType === 'store' && isPublic) {
    setHeaders({
      'cache-control': `s-maxage=1, stale-while-revalidate`,
    })
  }
  return json(await response.json())
}

export const POST: RequestHandler = async ({
  locals,
  params,
  url,
  request,
}) => {
  const { token } = locals
  const dst = new URL(
    `${PUBLIC_API_URL}/trpc/${params.query}?${url.searchParams}`
  )
  const response = await fetch(dst, {
    method: request.method,
    body: request.body,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: token ? `Bearer ${token}` : '',
    },
  })
  const xtoken = response.headers.get('x-token')
  if (xtoken) {
    await locals.session.set({
      token: xtoken,
    })
  }
  return json(await response.json())
}
