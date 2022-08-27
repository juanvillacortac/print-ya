import type { Action } from './$types'
export const DELETE: Action = async ({ locals }) => {
  await locals.session.destroy()
}
