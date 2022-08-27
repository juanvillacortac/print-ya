import { PUBLIC_API_URL } from '$env/static/public'
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
  // const isPublic = paths?.every(
  //   (p) =>
  //     !(
  //       p.includes('whoami') ||
  //       p.includes('login') ||
  //       p.includes('register') ||
  //       p.includes('orders') ||
  //       p.includes('customer')
  //     )
  // )
  // if (
  //   layoutType === 'store' &&
  //   isPublic
  // ) {
  //   return {
  //     headers: {
  //       'cache-control': `s-maxage=1, stale-while-revalidate`,
  //     },
  //   }
  // }
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
