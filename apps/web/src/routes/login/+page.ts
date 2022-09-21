import type { PageLoad } from './$types'
import trpc from '$lib/trpc/client'
import { redirect } from '@sveltejs/kit'

export const load: PageLoad = async ({ fetch, parent, url }) => {
  const { layoutData, user } = await parent()
  const client = trpc(fetch)
  switch (layoutData.layout) {
    case 'app':
      if (user) {
        const user = await client.query('user:whoami')
        if (user) {
          throw redirect(302, '/')
        }
      }
      return {
        loginPage: (await import('$lib/__app/Login.svelte')).default,
      }
    case 'store':
      const customer = await client.query('customer:whoami')
      if (customer) {
        throw redirect(302, '/')
      }
      return {
        loginPage: (await import('$lib/__storefront/Login.svelte')).default,
      }
  }
}
