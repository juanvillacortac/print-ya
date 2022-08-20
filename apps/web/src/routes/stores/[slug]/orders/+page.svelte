<script lang="ts">
  import OrdersList from '$lib/__app/OrdersList.svelte'
  import { layoutData } from '$lib'
</script>

<div class="flex flex-col mx-auto space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Sales orders
  </h3>
  <OrdersList urlPrefix="/stores/{$layoutData.store?.slug}/orders" />
</div>
