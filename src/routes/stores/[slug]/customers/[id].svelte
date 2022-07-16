<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, params }) => {
    const store = await trpc(fetch).query('stores:getBySlug', params.slug)
    if (!store) {
      return {
        status: 404,
      }
    }
    return {}
  }
</script>

<script lang="ts">
  import { pageSubtitle } from '$lib'
  import OrdersList from '$lib/__app/OrdersList.svelte'
  import { page } from '$app/stores'

  $pageSubtitle = 'Customer'
</script>

<div class="flex flex-col mx-auto space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Customer
  </h3>
  <h4 class="font-bold font-title text-black text-xl mb-4 dark:text-white">
    Orders
  </h4>
  <OrdersList customerId={$page.params.id} />
</div>
