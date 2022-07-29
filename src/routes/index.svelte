<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import Page, { load as storeLoad } from '$lib/__storefront/home/Page.svelte'
  import { session } from '$app/stores'
  import { pageSubtitle } from '$lib'

  export const load: Load = async (event) => {
    if (event.session.layout === 'store') {
      return await storeLoad(event)
    }
    return {}
  }
</script>

<script>
  export let data

  $: if ($session.layout === 'app') {
    $pageSubtitle = 'Dashboard'
  }
</script>

{#if $session.layout === 'store'}
  <Page />
{:else}
  <h2 class="font-bold font-title text-black text-3xl dark:text-white ">
    Dashboard
  </h2>
{/if}
