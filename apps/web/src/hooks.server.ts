import type { Handle } from '@sveltejs/kit'
import { handleSession } from 'svelte-kit-cookie-session'
import { appRoutes, getLayoutType } from '$lib/utils/layout'
import { getDefaultHost } from '$lib/utils/host'

import { sequence } from '@sveltejs/kit/hooks'
import { createTRPCProxy } from '$lib/trpc/proxy.server'
import type { tRPCRouter } from '@shackcart/trpc'

const privateQueries = [
  'user:whoami',
  'customer:whoami',
  'orders:get',
  'orders:list',
  'customer:get',
  'customer:list',
  'customer:whoami',
]

const handleAPI: Handle = async ({ event, resolve }) => {
  const { url, locals } = event
  const { token, layoutType } = locals

  let headers: Record<string, string> = {}
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  const { response, isTRPC } = await createTRPCProxy<tRPCRouter>({
    headers,
    resolve,
    event,
    url: `${__API_URL__}/trpc`,
    cache: {
      enable: layoutType == 'store',
      privateQueries,
    },
  })

  if (response.headers.has('x-access-token')) {
    await locals.session.set({
      token: response.headers.get('x-access-token') || '',
    })
    response.headers.delete('x-access-token')
  }

  const privatePaths = ['/account', '/bag']
  const isPublic =
    layoutType == 'store' &&
    !privatePaths.some((path) => url.pathname.startsWith(path))

  if (!isTRPC && isPublic) {
    response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate')
  }

  return response
}

export const session = handleSession(
  {
    secret: 'secret',
    expires: 7,
    key: 'token',
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    },
  },
  async ({ event, resolve }) => {
    event.locals = {
      ...event.locals,
      layoutType: getLayoutType(event),
      userAgent: event.request.headers.get('user-agent') || '',
      host: event.url.host,
      fullHost: `${event.url.protocol}//${event.url.host}`,
      token: event.locals.session.data.token || undefined,
    }
    return resolve(event)
  }
)

const guard: Handle = async ({ event, resolve }) => {
  if (event.request.headers.get('x-vercel-id')) {
    console.log(event.request.headers.get('x-vercel-id'))
  }

  const isAppPage =
    event.locals.layoutType === 'app' &&
    (Boolean(appRoutes.find((url) => event.url.pathname.startsWith(url))) ||
      event.url.pathname === '/')

  if (isAppPage && !event.locals.token && event.url.pathname !== '/login') {
    return Response.redirect(
      `${getDefaultHost() === 'localhost:5173' ? 'http://' : 'https://'}${
        event.url.host
      }/login?callbackUrl=${encodeURIComponent(event.url.pathname)}`,
      303
    )
  }

  return resolve(event)
}

export const handle = sequence(session, handleAPI, guard)
