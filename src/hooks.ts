import { getUserDetails } from '$lib/db/users'
import type { GetSession } from '@sveltejs/kit'
import { handleSession } from 'svelte-kit-cookie-session'
import cookie from 'cookie'
import { getLayoutType } from '$lib/utils/layout'

export const handle = handleSession(
  {
    secret: process.env['VITE_PY_SECRET'] || 'secret',
    expires: 30,
    cookie: { secure: false },
  },
  async function ({ event, resolve }) {
    let response: Response

    event.locals.layout = getLayoutType(event)

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

      response = await resolve(event, {
        ssr: !event.url.pathname.startsWith('/webhooks/success'),
      })
    } catch (error) {
      console.log(error)
      response = await resolve(event, {
        ssr: !event.url.pathname.startsWith('/webhooks/success'),
      })
      response.headers.append(
        'Set-Cookie',
        cookie.serialize('kit.session', '', {
          path: '/',
          expires: new Date('Thu, 01 Jan 1970 00:00:01 GMT'),
        })
      )
    }

    if (
      event.url.pathname.split('/').slice(1)[0] === 'app' &&
      !event.locals.session?.data?.userId
    ) {
      return Response.redirect(
        `${event.url.origin}/login?callbackUrl=${encodeURIComponent(
          event.url.pathname
        )}`,
        303
      )
    }

    return response
  }
)

export const getSession: GetSession = (event) => ({
  layout: event.locals.layout,
  userAgent: event.request.headers.get('user-agent'),
  host: event.url.protocol + '//' + event.url.host,
  ...event.locals.session.data,
})
