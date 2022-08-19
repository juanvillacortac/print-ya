import type { PageLoad } from './$types'
import trpc from '$lib/trpc/client'
import { redirect } from '@sveltejs/kit'

export const load: PageLoad = async ({ fetch, parent }) => {
  const { layoutData, user } = await parent()
  switch (layoutData.layout) {
    case 'app':
      if (user) {
        const user = await trpc(fetch).query('user:whoami')
        if (user) {
          throw redirect(302, '/')
        } else {
          await trpc(fetch).mutation('user:logout')
        }
      }
      return {
        loginPage: (await import('$lib/__app/Login.svelte')).default,
      }
    case 'store':
      const customer = await trpc(fetch).query('customer:whoami')
      if (customer) {
        throw redirect(302, '/')
      } else {
        await trpc(fetch).mutation('customer:logout')
      }
      return {
        loginPage: (await import('$lib/__storefront/Login.svelte')).default,
      }
  }
}
