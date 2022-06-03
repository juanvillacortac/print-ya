<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'
  import type { ProductModifier } from '$lib/db'
  import { Information16, TrashCan16 } from 'carbon-icons-svelte'
  import { fly } from 'svelte/transition'

  export let modifier: Omit<ProductModifier, 'items'> & {
    internalId?: string
    items?: (Unarray<ProductModifier['items']> & {
      internalId?: string
      meta: any
    })[]
  }

  type Unarray<T> = T extends Array<infer U> ? U : T

  let mounted
  $: if (modifier && !mounted) {
    modifier.items = modifier.items.map((i) => ({
      ...i,
      internalId: (Math.random() + 1).toString(36).substring(7),
    }))
    mounted = true
  }

  $: deleteItem = (
    i: Pick<Unarray<typeof modifier['items']>, 'id' | 'internalId'>
  ) => {
    const idx = modifier.items.findIndex((ii) =>
      i.id ? ii.id == i.id : ii.internalId == i.internalId
    )
    modifier.items[idx].active = false
    if (!modifier.items[idx].id) {
      modifier.items.splice(idx, 1)
      modifier.items = [...modifier.items]
    }
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
          >Font name</th
        >
        <th
          scope="col"
          class="py-3 px-6"
          class:sr-only={!modifier.items?.filter((m) => m.active).length}
          >Font url</th
        >
        <th
          scope="col"
          class="py-3 px-6"
          class:sr-only={!modifier.items?.filter((m) => m.active).length}
          >Is a webfont</th
        >
        <th scope="col" class="py-3 px-6">
          <span class="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
    <tbody class="z-10 relative">
      {#each modifier.items?.filter((i) => i.active) as i, idx (i.internalId)}
        <tr
          in:fly|local={{ x: -20 }}
          class="bg-white dark:bg-gray-800"
          class:border-b={idx !==
            modifier?.items?.filter((m) => m.active).length - 1}
          class:dark:border-gray-700={idx !==
            modifier?.items?.filter((m) => m.active).length - 1}
        >
          <td class="py-4 px-6">
            <input
              type="text"
              placeholder="Font name"
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none <sm:w-24ch dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={i.name}
              required
            />
          </td>

          <td class="py-4 px-6">
            <input
              type="url"
              placeholder="Font url"
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none <sm:w-24ch dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              pattern="https://.*"
              bind:value={i.meta.url}
              required
            />
          </td>

          <td class="py-4 px-6">
            <input type="checkbox" class="mx-auto" bind:checked={i.meta.web} />
          </td>

          <td class="flex text-right py-4 px-6 items-center justify-end">
            <button
              class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
              title="Delete"
              use:tooltip
              on:click={() => deleteItem(i)}
              type="button"><TrashCan16 /></button
            >
          </td>
        </tr>
      {:else}
        <tr
          class="bg-gray-50 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        >
          <td class="text-center py-4 px-6" colspan="5">
            <div class="flex space-x-2 w-full justify-center items-center">
              <Information16 />
              <p class="font-bold text-xs whitespace-nowrap">
                No modifier fonts
              </p>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
