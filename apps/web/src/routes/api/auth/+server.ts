import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ locals }) => {
  await locals.session.destroy()
  return json({ ok: true })
}
