import trpc from '$lib/trpc/client'
import { error, redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, url, fetch }) => {
  const { layoutData, user } = await parent()
  const token = url.searchParams.get('token')
  switch (layoutData.layout) {
    case 'app':
      if (user) {
        throw redirect(302, '/')
      }
      if (token) {
        const { ok } = await trpc(fetch).query(
          'user:checkPasswordRecoveryToken',
          token
        )
        if (!ok) throw error(404, 'Page not found')
      }
      return {
        loginPage: (await import('$lib/__app/LoginRecover.svelte')).default,
      }
    default:
      const customer = await trpc(fetch).query('customer:whoami')
      if (customer) {
        throw redirect(302, '/')
      }
      if (token) {
        const { ok } = await trpc(fetch).query(
          'customer:checkPasswordRecoveryToken',
          {
            token,
            storeId: layoutData.store?.id || '',
          }
        )
        if (!ok) throw error(404, 'Page not found')
      }
      return {
        loginPage: (await import('$lib/__storefront/LoginRecover.svelte'))
          .default,
      }
  }
}
