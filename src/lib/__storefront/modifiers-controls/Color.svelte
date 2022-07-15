<script lang="ts">
  import { squareratio } from '$lib/actions/aspectratio'
  import { tooltip } from '$lib/components/tooltip'
  import type { ProductModifierItem } from '$lib/db'
  import type { ModifierValue } from '$lib/utils/modifiers'

  export let value: ModifierValue
  export let items: ProductModifierItem[]
  export let disabled = false

  $: if (!value?.itemId && items?.length) {
    value = {
      itemId: items[0].id,
      value: items[0].name,
    }
  }

  $: list = items.filter((i) => (disabled ? value.itemId == i.id : true))
</script>

<div class="w-full grid gap-3 grid-cols-6 sm:grid-cols-8">
  {#each list || [] as i}
    <button
      class="rounded pb-full border-2 w-full transform duration-200 dark:border-gray-600"
      title={i.meta.name}
      class:cursor-help={disabled}
      class:scale-130={value.itemId == i.id && !disabled}
      class:!border-blue-800={value.itemId == i.id && !disabled}
      on:click={() =>
        disabled
          ? null
          : (value = {
              itemId: i.id,
              value: i.name,
            })}
      use:tooltip
      use:squareratio
      style="will-change: transform; aspect-ratio: 1/1; background-color: {i.name ||
        'black'}"
    />
  {/each}
</div>
