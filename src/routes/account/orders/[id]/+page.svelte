<script lang="ts">
  import OrderDetails from '$lib/__app/OrderDetails.svelte'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  {#if !data.guest}
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
      >{data.order.id}</span
    >
  </h3>
  <OrderDetails bind:order={data.order} mode="customer" />
</div>
