<script lang="ts">
  import 'bytemd/dist/index.css'
  import {
    AddAlt16,
    Information16,
    TrashCan16,
    ChevronRight16,
    CheckboxChecked16,
    CharacterWholeNumber16,
    TextSelection16,
    Image16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { ProductModifier } from '$lib/db'
  import { fly, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import SelectionTable from './modifiers/SelectionTable.svelte'
  import ColorTable from './modifiers/ColorTable.svelte'
  import FontTable from './modifiers/FontTable.svelte'

  type Unarray<T> = T extends Array<infer U> ? U : T

  let mounted = false

  export let modifiers: (Omit<ProductModifier, 'items'> & {
    internalId?: string
    items?: (Unarray<ProductModifier['items']> & { internalId?: string })[]
  })[] = []

  $: if (modifiers && !mounted) {
    modifiers = modifiers.map((m) => ({
      ...m,
      internalId: (Math.random() + 1).toString(36).substring(7),
      items: m.items.map((i) => ({
        ...i,
        internalId: (Math.random() + 1).toString(36).substring(7),
        meta: i.meta || {},
      })),
    }))
    mounted = true
  }

  const addModifier = () => {
    const newId = (Math.random() + 1).toString(36).substring(7)
    modifiers = [
      ...modifiers,
      {
        internalId: newId,
        id: '',
        productId: undefined,
        active: true,
        name: '',
        type: 'select',
        templateAccessor: '',
        items: [],
        defaultValue: '',
      },
    ]
    expanded = newId
  }

  const addItem = ({
    id,
    internalId,
  }: Pick<
    Unarray<Unarray<typeof modifiers>['items']>,
    'id' | 'internalId'
  >) => {
    const idx = modifiers.findIndex((m) =>
      internalId ? m.internalId == internalId : m.id == id
    )
    modifiers[idx].items = [
      ...modifiers[idx].items,
      {
        internalId: (Math.random() + 1).toString(36).substring(7),
        id: '',
        cost: 0,
        active: true,
        name: '',
        percentage: false,
        productModifierId: '',
        meta: {},
      },
    ]
    modifiers = modifiers
    expanded = modifiers[idx].id || modifiers[idx].internalId
  }

  const modifierTypes = [
    {
      type: 'select',
      name: 'Selection',
      tree: SelectionTable,
      embeddable: true,
    },
    {
      type: 'font',
      name: 'Font selection',
      tree: FontTable,
      embeddable: true,
    },
    // { type: 'multiple', name: 'Multiple selection' },
    { type: 'text', name: 'Text', embeddable: true, icon: TextSelection16 },
    { type: 'image', name: 'Image', embeddable: true, icon: Image16 },
    {
      type: 'numeric',
      name: 'Numeric',
      embeddable: true,
      icon: CharacterWholeNumber16,
    },
    {
      type: 'toggle',
      name: 'Toggle',
      tree: false,
      embeddable: true,
      icon: CheckboxChecked16,
    },
    { type: 'color', name: 'Color', tree: ColorTable, embeddable: true },
  ]

  const deleteModifier = ({
    id,
    internalId,
  }: Pick<Unarray<typeof modifiers>, 'id' | 'internalId'>) => {
    const idx = modifiers.findIndex((m) =>
      internalId ? m.internalId == internalId : m.id == id
    )
    modifiers[idx].active = false
    if (internalId) {
      modifiers.splice(idx, 1)
      modifiers = [...modifiers]
    }
  }

  let expanded: string = ''
</script>

<div
  class="bg-white rounded-xl flex flex-col h-full space-y-4 shadow w-full p-4 relative overflow-hidden dark:bg-gray-800"
>
  <div class="flex w-full justify-between items-center">
    <h3 class="font-bold text-xs block">Product modifiers</h3>
    <div class="flex space-x-1">
      <button
        class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
        title="Add modifier"
        type="button"
        on:click={addModifier}
        use:tooltip
      >
        <AddAlt16 class="font-bold" />
      </button>
    </div>
  </div>
  <div
    class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
  >
    {#each modifiers.filter((m) => m.active) as m, idx (m.internalId)}
      {@const mType = modifierTypes.find((t) => t.type == m.type)}
      <div
        class="flex flex-col flex-grow space-y-2 w-full"
        in:fly|local={{ x: -20 }}
        out:slide|local={{ duration: 400, easing: expoOut }}
      >
        <div
          class="flex w-full p-4 items-center lg:space-x-4 <lg:flex-col <lg:space-y-4"
        >
          {#if mType?.tree}
            <button
              class="rounded flex p-1 duration-200"
              title="Show/hide items"
              use:tooltip
              on:click={() =>
                expanded && (expanded === m.internalId || expanded === m.id)
                  ? (expanded = '')
                  : (expanded = m.id || m.internalId)}
              type="button"
              ><ChevronRight16
                class="transform duration-200 transition-transform {expanded &&
                (expanded === m.internalId || expanded === m.id)
                  ? 'rotate-90'
                  : ''}"
              /></button
            >
          {:else if mType?.icon}
            <div class="flex p-1">
              <svelte:component this={mType.icon} />
            </div>
          {/if}
          <input
            type="text"
            placeholder="Modifier title"
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            required
            bind:value={m.name}
          />
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={m.type}
            on:change={() => (m.defaultValue = '')}
          >
            {#each modifierTypes as type}
              <option value={type.type}>{type.name}</option>
            {/each}
          </select>
          <!-- {#if m.type === 'text'}
            <input
              type="text"
              placeholder="Default value"
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={m.defaultValue}
            />
          {:else if m.type === 'numeric'}
            <input
              type="number"
              placeholder="Default value"
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={m.defaultValue}
            />
          {/if} -->
          {#if modifierTypes.find((t) => t.type === m.type).embeddable}
            <input
              type="text"
              placeholder="Template accessor"
              bind:value={m.templateAccessor}
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            />
          {/if}
          <div class="flex space-x-4 items-center">
            {#if modifierTypes.find((t) => t.type == m.type)?.tree}
              <button
                class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                title="Add item"
                use:tooltip
                on:click={() => addItem(m)}
                type="button"><AddAlt16 /></button
              >
            {/if}
            <button
              class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
              title="Delete modifier"
              use:tooltip
              on:click={() => deleteModifier(m)}
              type="button"><TrashCan16 /></button
            >
          </div>
        </div>

        {#if expanded && (expanded === m.internalId || expanded === m.id) && mType?.tree}
          <div
            class="flex-grow w-full px-4 pb-4 overflow-x-auto"
            transition:slide|local={{ duration: 800, easing: expoOut }}
          >
            <svelte:component this={mType?.tree} bind:modifier={m} />
          </div>
        {/if}
      </div>
    {:else}
      <div
        class="bg-gray-50 text-xs w-full text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        in:slide|local={{ duration: 400, easing: expoOut }}
      >
        <div class="text-center w-full py-4 px-6">
          <div class="flex space-x-2 w-full justify-center items-center">
            <Information16 />
            <p class="font-bold text-xs whitespace-nowrap">No modifiers</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
