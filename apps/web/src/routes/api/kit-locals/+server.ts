import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ locals }) => {
  const { fullHost, host, userAgent, layoutType } = locals
  return json({
    fullHost,
    host,
    userAgent,
    layoutType,
  })
}
