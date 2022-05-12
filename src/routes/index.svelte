<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import Page, { load as storeLoad } from '$lib/__storefront/home/Page.svelte'
  import { session } from '$app/stores'
  import { isLocalhost } from '$lib/utils/host'

  export const load: Load = async (event) => {
    if (event.session.layout === 'store') {
      return await storeLoad(event)
    }
    return {}
  }
</script>

<script>
  export let data
</script>

{#if $session.layout === 'store'}
  <Page {data} />
{:else}
  <div class="flex h-screen w-full items-center justify-center">
    <h1 class="font-title font-bold text-6xl">WIP</h1>
  </div>
{/if}
