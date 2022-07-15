<script lang="ts">
  import { createModifiersMap } from '$lib/utils/modifiers'
  import type { Product } from '$lib/db'
  import Select from './modifiers-controls/Select.svelte'
  import Upsell from './modifiers-controls/Upsell.svelte'
  import Font from './modifiers-controls/Font.svelte'
  import Toggle from './modifiers-controls/Toggle.svelte'
  import Image from './modifiers-controls/Image.svelte'
  import Color from './modifiers-controls/Color.svelte'
  import Text from './modifiers-controls/Text.svelte'

  export let product!: Product
  export let disabled = false

  export let modifiers = createModifiersMap(product)

  $: productModifiers = product?.modifiers || []

  $: fontsItems = productModifiers.filter!((m) => m.type === 'font')
    .map((m) => m.items || [])
    .reduce((a, b) => [...a, ...b], [])
    .map((i) => ({
      name: i?.name || '',
      url: i?.meta.web
        ? i?.meta?.url
        : `/api/fontface?name=${encodeURIComponent(
            i?.name || ''
          )}&src=${encodeURIComponent(i.meta.url)}`,
    }))
</script>

<svelte:head>
  {#each fontsItems as f}
    <link href={f.url} rel="stylesheet" />
  {/each}
</svelte:head>

<div class="flex flex-col space-y-4 w-full">
  {#each product?.modifiers || [] as m}
    {@const item = modifiers[m.id]
      ? m.items?.find((i) => i.id === modifiers[m.id]?.itemId)
      : undefined}
    {@const itemName =
      m.type === 'font'
        ? item?.name
        : m.type === 'color'
        ? item?.meta?.name
        : ''}
    <div
      class="flex w-full {m.type
        ? 'space-y-2 flex-col'
        : 'space-x-4 items-center justify-end'} lg:justify-between"
    >
      <div class="font-bold font-title text-black text-xs dark:text-white">
        {m.name}{#if itemName}: <span class="font-normal">{itemName}</span>{/if}
      </div>
      {#if m.type === 'select'}
        <Select items={m.items} bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'upsell'}
        <Upsell items={m.items} bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'font'}
        <Font items={m.items} bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'toggle'}
        <Toggle bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'image'}
        <Image {product} bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'text'}
        <Text bind:value={modifiers[m.id]} {disabled} />
      {:else if m.type === 'color'}
        <Color items={m.items} bind:value={modifiers[m.id]} {disabled} />
      {/if}
    </div>
  {/each}
</div>
