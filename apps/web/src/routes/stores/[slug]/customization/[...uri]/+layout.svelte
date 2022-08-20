<script lang="ts">
  import '$lib/__storefront/web-components'
  import { createLayoutStore, layoutData } from '$lib'
  import { setContext } from 'svelte'
  import DecalshutLayout from '$lib/__layouts/DecalshutLayout.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { ColorPalette24 } from 'carbon-icons-svelte'

  const layoutStore = createLayoutStore({
    editable: true,
    initialState: $layoutData.storeData,
    store: $layoutData.store!,
  })

  setContext('customizable', true)
  setContext('layout-store', layoutStore)
</script>

<DecalshutLayout>
  <slot />
</DecalshutLayout>

<div class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center">
  <button
    class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 relative hover:scale-95"
    title="Change primary color"
    on:click={() => document.getElementById(`color-palette`)?.click()}
    use:tooltip
  >
    <input
      id="color-palette"
      type="color"
      bind:value={$layoutStore.theme.primary}
      class="h-0 opacity-0 w-0 overflow-hidden absolute"
    />
    <ColorPalette24 />
  </button>
</div>
