<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import StoreLogin, { load as storeLoad } from '$lib/__storefront/Login.svelte'
  import AppLogin, { load as appLoad } from '$lib/__app/Login.svelte'
  import { session } from '$app/stores'

  export const load: Load = async (event) => {
    switch (event.session.layout) {
      case 'app':
        return await appLoad(event)
      case 'store':
        return await storeLoad(event)
    }
  }
</script>

{#if $session.layout == 'store'}
  <StoreLogin />
{:else if $session.layout == 'app'}
  <AppLogin />
{/if}
