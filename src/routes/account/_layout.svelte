<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, url }) => {
    const customer = await trpc(fetch).query('customer:whoami')
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
