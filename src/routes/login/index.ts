import * as db from '$lib/db'
import { ErrorHandler } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'

export const post: RequestHandler = async (event) => {
  const { email, password, isLogin } = await event.request.json()
  console.log(password)

  try {
    const { body } = await db.login({ email, password, isLogin })
    event.locals.session.data = body
    return {
      status: 200,
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}

export const get: RequestHandler = async (event) => {
  const { userId } = await db.getUserDetails(event)
  if (!userId) {
    return {
      status: 200,
    }
  }
  try {
    await db.getUser({ userId })
    return {
      status: 302,
      headers: {
        location: '/',
      },
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}

export async function del({ locals }) {
  locals.session.destroy()

  return {
    body: {
      ok: true,
    },
  }
}
