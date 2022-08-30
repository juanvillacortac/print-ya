import type { ExternalFetch, Handle } from '@sveltejs/kit'
import { handleSession } from 'svelte-kit-cookie-session'
import { appRoutes, getLayoutType } from '$lib/utils/layout'
import { getDefaultHost } from '$lib/utils/host'

import { sequence } from '@sveltejs/kit/hooks'
export const session = handleSession({
  secret: 'secret',
  expires: 7,
  key: 'token',
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
})

const logic: Handle = async ({ event, resolve }) => {
  let response: Response

  event.locals = {
    ...event.locals,
    layoutType: getLayoutType(event),
    userAgent: event.request.headers.get('user-agent') || '',
    host: event.url.host,
    fullHost: `${event.url.protocol}//${event.url.host}`,
    token: event.locals.session.data.token || undefined,
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

  response = await resolve(event, {
    // ssr: event.locals.layoutType !== 'app',
    ssr: false,
  })

  if (
    event.locals.layoutType === 'store' &&
    !event.url.pathname.startsWith('/account') &&
    !event.url.pathname.startsWith('/bag') &&
    !event.url.pathname.startsWith('/api/trpc')
  ) {
    response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate')
  }

  return response
}

export const handle = sequence(session, logic)
