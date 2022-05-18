import { getUserDetails } from '$lib/db/users'
import type { GetSession } from '@sveltejs/kit'
import { handleSession } from 'svelte-kit-cookie-session'
import cookie from 'cookie'
import { appRoutes, getLayoutType, storeRoutes } from '$lib/utils/layout'
import { getDefaultHost } from '$lib/utils/host'
import { browser } from '$app/env'

export const handle = handleSession(
  {
    secret: process.env['VITE_PY_SECRET'] || 'secret',
    expires: 30,
    cookie: { secure: false },
  },
  async function ({ event, resolve }) {
    let response: Response

    event.locals.layout = getLayoutType(event)
    console.log(event.url.searchParams.get('store'), 'tiendita')

    // Set default locale if user preferred locale does not match
    try {
      if (event.locals.cookies) {
        if (event.locals.cookies['kit.session']) {
          const { userId } = await getUserDetails(event)
          const newSession = {
            userId,
            expires: event.locals.session.data.expires,
          }

          if (
            JSON.stringify(event.locals.session.data) !==
            JSON.stringify(newSession)
          ) {
            event.locals.session.data = { ...newSession }
          }
        }
      }

      const isAppPage =
        event.locals.layout === 'app' &&
        (Boolean(appRoutes.find((url) => event.url.pathname.startsWith(url))) ||
          event.url.pathname === '/')

      if (
        isAppPage &&
        !event.locals.session?.data?.userId &&
        event.url.pathname !== '/login'
      ) {
        return Response.redirect(
          `${
            getDefaultHost() === 'localhost:3000' ? 'http://' : 'https://'
          }${getDefaultHost()}/login?callbackUrl=${encodeURIComponent(
            event.url.pathname
          )}`,
          303
        )
      }

      if (event.locals.layout === 'store') {
        response.headers.set(
          'Cache-Control',
          's-maxage=1, stale-while-revalidate=59'
        )
      }

      response = await resolve(event, {
        ssr: event.locals.layout !== 'app',
      })
    } catch (error) {
      response = await resolve(event, {
        ssr: event.locals.layout !== 'app',
      })
      response.headers.append(
        'Set-Cookie',
        cookie.serialize('kit.session', '', {
          path: '/',
          expires: new Date('Thu, 01 Jan 1970 00:00:01 GMT'),
        })
      )
    }

    return response
  }
)

export const getSession: GetSession = (event) => ({
  layout: event.locals.layout,
  userAgent: event.request.headers.get('user-agent'),
  host: event.url.host,
  fullHost: `${event.url.protocol}//${event.url.host}`,
  ...event.locals.session.data,
})
