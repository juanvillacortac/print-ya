<script lang="ts">
  import type { Order } from '$lib/db'
  import OrderDetails from '$lib/__app/OrderDetails.svelte'
  import type { PageData } from './$types'
  export let data: PageData
</script>

<div class="flex flex-col mx-auto space-y-4 pb-4">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Order # <span
      class="rounded font-mono font-normal bg-gray-200 text-xs leading-none ml-2 p-1 dark:bg-gray-600"
      >{data.order.id}</span
    >
  </h3>
  <OrderDetails bind:order={data.order} />
</div>
