import trpc from '$lib/trpc/client'
import type { LayoutData } from '@shackcart/db'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals, request }) => {
  const { email, password, layoutData } = (await request.json()) as {
    email: string
    password: string
    layoutData: LayoutData
  }
  if (layoutData.layout === 'store' && layoutData.store) {
    const token = await trpc({ token: locals.token }).mutation(
      'customer:login',
      {
        email,
        password,
        storeId: layoutData.store.id,
      }
    )
    await locals.session.set({ token })
    return new Response('Ok', { status: 200 })
  }
  if (layoutData.layout === 'app') {
    const token = await trpc({ token: locals.token }).mutation('user:login', {
      email,
      password,
    })
    await locals.session.set({ token })
    return new Response('Ok', { status: 200 })
  }
  return new Response('Error', { status: 500 })
}
