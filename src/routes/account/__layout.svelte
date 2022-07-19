<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, url }) => {
    const customer = await trpc(fetch).query('customer:whoami')
    if (
      url.pathname.startsWith('/account/orders/') &&
      url.pathname != '/account/orders/' &&
      url.searchParams.get('token')
    )
      return {}
    if (!customer) {
      return {
        status: 302,
        redirect: `/login?callbackUrl=${encodeURIComponent(url.pathname)}`,
      }
    }
    return {}
  }
</script>

<slot />
