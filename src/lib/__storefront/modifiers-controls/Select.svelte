<script lang="ts">
  import type { ProductModifierItem } from '$lib/db'

  import type { ModifierValue } from '$lib/utils/modifiers'

  export let value: ModifierValue
  export let items: ProductModifierItem[]
  export let disabled = false
</script>

{#if disabled}
  {@const i = items?.find((i) => i.id == value.itemId)}
  <p class="text-xs">
    {i?.name}{#if i?.cost}&nbsp;<strong
        >({i?.cost < 0 ? '-' : '+'}{!i.percentage ? '$' : ''}{Math.abs(
          i.cost || 0
        )}{i.percentage ? '%' : ''})</strong
      >{/if}
  </p>
{:else}
  <select
    class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none !pr-8 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
    bind:value={value.itemId}
    on:change={() =>
      (value.value = items?.find((i) => i.id == value.itemId)?.name)}
  >
    {#each items || [] as i}
      <option value={i.id}
        >{i.name}{#if i.cost}&nbsp;(<strong
            >{i.cost < 0 ? '-' : '+'}{!i.percentage ? '$' : ''}{Math.abs(
              i.cost
            )}{i.percentage ? '%' : ''}</strong
          >){/if}</option
      >
    {/each}
  </select>
{/if}
