<script context="module" lang="ts">
  import trpc from '$lib/trpc/client'
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, params, stuff, url }) => {
    const order = await trpc(fetch).query('orders:get', {
      orderId: params.id,
      token: url.searchParams.get('token') || undefined,
    })
    const customer = await trpc(fetch).query('customer:whoami')
    if (
      !order ||
      order.storeId != stuff?.store?.id ||
      (customer && order.customerId != customer.id)
    ) {
      return {
        status: 404,
      }
    }
    return {
      props: {
        order,
        guest: Boolean(order.token),
      },
    }
  }
</script>

<script lang="ts">
  import type { Order } from '$lib/db'
  import { pageSubtitle } from '$lib'
  import OrderDetails from '$lib/__app/OrderDetails.svelte'
  import { page } from '$app/stores'

  export let order: Order
  export let guest: boolean

  $: $pageSubtitle = `Order #${order.id}`
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  {#if !guest}
    <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
      <a href="/" class="hover:underline">Home</a>
      <span>/</span>
      <p>Account</p>
      <span>/</span>
      <a href="/account/orders" class="hover:underline">Orders</a>
    </div>
  {/if}
  <h3
    class="flex font-bold font-title text-black text-3xl items-center dark:text-white"
  >
    Order # <span
      class="rounded font-mono font-normal bg-gray-100 text-lg leading-none ml-2 p-1 dark:bg-gray-600"
      >{order.id}</span
    >
  </h3>
  <OrderDetails bind:order mode="customer" />
</div>
