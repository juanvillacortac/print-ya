<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'
  import type { ProductModifier } from '@shackcart/db'
  import { Information16, TrashCan16 } from 'carbon-icons-svelte'
  import { get, writable } from 'svelte/store'
  import { fly } from 'svelte/transition'

  export let modifier: Omit<ProductModifier, 'items'> & {
    internalId?: string
    items: (Unarray<ProductModifier['items']> & { internalId?: string })[]
  }

  export let disabled = false

  type Unarray<T> = T extends Array<infer U> ? U : T

  const items = writable(
    modifier.items.map((i) => ({
      ...i,
      internalId: (Math.random() + 1).toString(36).substring(7),
    }))
  )

  $: if ($items) {
    if (modifier.items.length > $items.length) {
      $items.push({
        ...modifier.items[modifier.items?.length - 1],
        internalId: (Math.random() + 1).toString(36).substring(7),
      })
      $items = $items
    }
    modifier.items = $items
  }

  const deleteItem = (
    i: Pick<Unarray<typeof modifier['items']>, 'id' | 'internalId'>
  ) => {
    const idx = modifier.items.findIndex((ii) =>
      i.id ? ii.id == i.id : ii.internalId == i.internalId
    )
    $items[idx].active = false
    if (!$items[idx].id) {
      const newList = $items
      newList.splice(idx, 1)
      items.set(newList)
    }
  }

  let hovering: number | null

  $: drop = (event, target) => {
    if (disabled) return
    event.dataTransfer.dropEffect = 'move'
    const start = parseInt(event.dataTransfer.getData('text/plain'))
    const newTracklist = $items

    if (start < target) {
      newTracklist.splice(target + 1, 0, newTracklist[start])
      newTracklist.splice(start, 1)
    } else {
      newTracklist.splice(target, 0, newTracklist[start])
      newTracklist.splice(start + 1, 1)
    }
    items.set(newTracklist)
    hovering = null
  }

  const dragstart = (event, i) => {
    if (disabled) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    const start = i
    event.dataTransfer.setData('text/plain', start)
  }
</script>

<div
  class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
>
  <table class="text-sm text-left w-full text-gray-500 dark:text-gray-400">
    <thead
      class="bg-gray-50 text-xs text-gray-700 uppercase !z-30 dark:bg-gray-700 dark:text-gray-400"
      class:sr-only={!modifier.items?.filter((m) => m.active).length}
    >
      <tr>
        <th
          scope="col"
          class="py-3 px-6"
          class:sr-only={!modifier.items?.filter((m) => m.active).length}
          >{modifier.type === 'color' ? 'Color' : 'Title'}</th
        >
        <th
          scope="col"
          class="py-3 px-6"
          class:sr-only={!modifier.items?.filter((m) => m.active).length}
          >Cost</th
        >
        <th
          scope="col"
          class="py-3 px-6"
          class:sr-only={!modifier.items?.filter((m) => m.active).length}
          >Cost as percentage</th
        >

        {#if !disabled}
          <th scope="col" class="py-3 px-6">
            <span class="sr-only">Actions</span>
          </th>
        {/if}
      </tr>
    </thead>
    <tbody class="z-10 relative">
      {#each $items?.filter((i) => i.active) as i, idx (i.internalId)}
        <tr
          in:fly|local={{ x: -20 }}
          draggable={!disabled}
          on:dragstart|stopPropagation={(event) => dragstart(event, idx)}
          on:drop|preventDefault|stopPropagation={(event) => drop(event, idx)}
          on:dragover|preventDefault={() => {}}
          on:dragenter|stopPropagation={() =>
            disabled ? null : (hovering = idx)}
          on:dragend={() => (disabled ? null : (hovering = null))}
          class:bg-blue-100={hovering == idx}
          class:dark:bg-gray-900={hovering == idx}
          class="bg-white dark:bg-gray-800"
          class:border-b={idx !==
            modifier?.items?.filter((m) => m.active).length - 1}
          class:dark:border-gray-700={idx !==
            modifier?.items?.filter((m) => m.active).length - 1}
        >
          <th
            scope="row"
            class="flex font-bold h-full min-h-64px py-4 px-6 text-gray-900 whitespace-nowrap items-center dark:text-white"
          >
            {#if modifier.type === 'color'}
              <input
                type="color"
                required
                bind:value={i.name}
                class="m-auto"
                {disabled}
              />
            {:else}
              <input
                type="text"
                placeholder="Item title"
                class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none <sm:w-24ch dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                required
                bind:value={i.name}
                {disabled}
              />
            {/if}
          </th>

          <td class="py-4 px-6">
            <input
              class="bg-white border rounded border-gray-300 text-xs text-right leading-tight py-2 px-3 w-18 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              min={0}
              step="any"
              required
              bind:value={i.cost}
              {disabled}
            />
          </td>
          <td class="py-4 px-6">
            <input
              type="checkbox"
              class="mx-auto"
              bind:checked={i.percentage}
              {disabled}
            />
          </td>

          {#if !disabled}
            <td class="text-right py-4 px-6">
              <button
                class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                title="Delete"
                use:tooltip
                on:click={() => deleteItem(i)}
                type="button"><TrashCan16 /></button
              >
            </td>
          {/if}
        </tr>
      {:else}
        <tr
          class="bg-gray-50 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        >
          <td class="text-center py-4 px-6" colspan="5">
            <div class="flex space-x-2 w-full justify-center items-center">
              <Information16 />
              <p class="font-bold text-xs whitespace-nowrap">
                No modifier items
              </p>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
