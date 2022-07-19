<script lang="ts">
  import { customer, pageSubtitle } from '$lib'
  import OrdersList from '$lib/__app/OrdersList.svelte'
  import { page } from '$app/stores'

  $pageSubtitle = 'Sales orders'
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>Account</p>
    <span>/</span>
    <p>Orders</p>
  </div>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    My orders
  </h3>
  <OrdersList
    urlPrefix="/account/orders"
    customerId={$customer?.id}
    small
    load={!!$customer}
  />
</div>
