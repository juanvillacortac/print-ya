<script lang="ts">
  import type { ModifierValue } from '@shackcart/db'

  export let value: ModifierValue
  export let disabled = false
</script>

{#if disabled}
  <p class="text-xs">{value.value || 'N/A'}</p>
{:else}
  <input
    type="text"
    placeholder="Write something..."
    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none  dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
    bind:value={value.value}
    on:input={() => (!value.value?.trim() ? (value = {}) : null)}
  />
{/if}
