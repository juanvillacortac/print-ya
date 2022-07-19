<script context="module" lang="ts">
  import trpc from '$lib/trpc/client'
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, params }) => {
    const store = await trpc(fetch).query('stores:getBySlug', params.slug)
    if (!store) {
      return {
        status: 404,
      }
    }
    const order = await trpc(fetch).query('orders:get', {
      orderId: params.id,
    })
    if (!order || order.storeId != store.id) {
      return {
        status: 404,
      }
    }
    return {
      props: {
        order,
      },
    }
  }
</script>

<script lang="ts">
  import type { Order } from '$lib/db'
  import { pageSubtitle } from '$lib'
  import OrderDetails from '$lib/__app/OrderDetails.svelte'
  export let order: Order

  $: $pageSubtitle = `Order #${order.id}`
</script>

<div class="flex flex-col mx-auto space-y-4 pb-4">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Order # <span
      class="rounded font-mono font-normal bg-gray-200 text-xs leading-none ml-2 p-1 dark:bg-gray-600"
      >{order.id}</span
    >
  </h3>
  <OrderDetails bind:order />
</div>
