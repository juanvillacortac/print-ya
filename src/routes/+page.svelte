<script>
  import { layoutData } from '$lib'
  import { Page } from '$lib/__storefront/home/page'
</script>

{#if $layoutData.layout === 'store'}
  <Page />
{:else}
  <h2 class="font-bold font-title text-black text-3xl dark:text-white ">
    Dashboard
  </h2>
{/if}
