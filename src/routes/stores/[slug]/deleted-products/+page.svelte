<script lang="ts">
  import { Warning32 } from 'carbon-icons-svelte'
  import ProductsList from '$lib/__app/ProductsList.svelte'
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Deleted products
</h2>
<div
  class="border-dashed rounded-lg flex space-x-4 bg-red-500 bg-opacity-20 border-2 border-red-500 mb-6 p-4 items-center"
>
  <Warning32 class="text-red-500" />
  <p class="m-auto text-xs">
    <span class="font-bold">Advice:</span> products listed here will be removed after
    30 days of being added.
  </p>
</div>

<ProductsList archived />
