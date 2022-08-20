<script lang="ts">
  import Image from '$lib/components/caravaggio/Image.svelte'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import type { ProductModifierItem } from '@shackcart/db'
  import type { ModifierValue } from '$lib/utils/modifiers'
  import { Close24 } from 'carbon-icons-svelte'
  import { expoOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'

  export let value: ModifierValue
  export let items: ProductModifierItem[]
  export let disabled = false

  $: if (!value.itemIds) {
    value.itemIds = []
  }

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'embed',
      b: '000000.0',
    },
  }

  $: list = items?.filter((i) =>
    disabled ? value.itemIds?.includes(i.id) : i !== undefined
  )
</script>

{#if list?.length}
  <div class="w-full grid gap-4 grid-cols-2 ">
    {#each list || [] as i}
      {@const selected = value.itemIds?.includes(i.id)}
      <div
        class="border rounded-lg w-full transform transition-transform duration-200 relative dark:border-gray-700"
        class:hover:scale-102={!disabled}
        style="will-change: transform"
        class:!shadow={selected}
        class:!scale-102={selected}
        class:!border-blue-500={selected}
      >
        {#if selected && !disabled}
          <button
            type="button"
            transition:fly|local={{
              y: 5,
              easing: expoOut,
              duration: 400,
            }}
            class="bg-white border rounded-full border-gray-300 shadow p-1 transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700 dark:border-gray-600"
          >
            <Close24 />
          </button>
        {/if}
        {#if Array.isArray(value.itemIds) && !disabled}
          <input
            type="checkbox"
            class="cursor-pointer h-full w-full opacity-0 z-20 absolute"
            bind:group={value.itemIds}
            value={i.id}
          />
        {/if}
        <div class="flex flex-col h-full space-y-2 p-2 justify-between">
          <div class="flex flex-col space-y-2">
            <div
              class="rounded-lg bg-gray-100 w-auto overflow-hidden pointer-events-none select-none dark:bg-gray-700"
            >
              <div
                class="flex w-full p-2 items-center justify-center aspect-square"
              >
                <Image
                  {options}
                  src={i.meta?.image}
                  class="rounded object-cover w-full aspect-square"
                />
              </div>
            </div>
            <div class="flex flex-col">
              <h3 class="font-bold text-sm">{i.name}</h3>
              {#if i.meta.description}
                <p
                  class="text-sm leading-none pb-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                >
                  {i.meta?.description}
                </p>
              {/if}
            </div>
          </div>
          <p class="font-bold text-right text-lg">
            {i.cost < 0 ? '-' : ''}{!i.percentage ? '$' : ''}{Math.abs(
              i.cost
            )}{i.percentage ? '%' : ''}
          </p>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p class="text-xs">N/A</p>
{/if}
