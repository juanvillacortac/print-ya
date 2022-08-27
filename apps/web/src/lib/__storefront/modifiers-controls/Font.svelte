<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'

  import type { ModifierValue, ProductModifierItem } from '@shackcart/db'

  import { CloseOutline24 } from 'carbon-icons-svelte'

  export let value: ModifierValue
  export let items: ProductModifierItem[]
  export let disabled = false
</script>

{#if disabled}
  {@const i = items?.find((i) => i.id == value.itemId)}
  {#if i}
    <p
      class="text-4xl"
      style={`will-change: transform; font-family: "${i?.name}";`}
    >
      {i?.name}
    </p>
  {:else}
    <p class="text-xs">N/A</p>
  {/if}
{:else}
  <div class="w-full grid gap-4 grid-cols-3 lg:w-full  lg:grid-cols-3">
    <button
      class="border-dashed rounded flex border-2 text-lg w-full p-2 transform transition-transform text-gray-200 duration-200 items-center justify-center dark:border-gray-600 dark:text-gray-600"
      title="Unset font"
      on:click={() => (value = {})}
      use:tooltip
      style="will-change: transform;"><CloseOutline24 /></button
    >
    {#each items || [] as i}
      <button
        class="rounded border-2 text-lg w-full p-1 transform transition-transform duration-200 dark:border-gray-600"
        title={i.name}
        on:click={() =>
          (value = {
            itemId: i.id,
            value: {
              name: i?.name,
              url: i?.meta.web
                ? i.meta.url
                : `/api/fontface?name=${encodeURIComponent(
                    i.name
                  )}&src=${encodeURIComponent(i.meta.url)}`,
            },
          })}
        class:scale-120={value.itemId == i.id}
        class:!border-blue-800={value.itemId == i.id}
        use:tooltip
        style={`will-change: transform; font-family: "${i.name}";`}
        >Hello</button
      >
    {/each}
  </div>
{/if}
