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
      },
    ]
    modifiers = modifiers
    expanded = modifiers[idx].id || modifiers[idx].internalId
  }

  const modifierTypes = [
    { type: 'select', name: 'Selection', tree: true, embeddable: true },
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
    { type: 'color', name: 'Color', tree: true, embeddable: true },
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

  $: deleteItem = (
    m: Pick<Unarray<typeof modifiers>, 'id' | 'internalId'>,
    i: Pick<Unarray<Unarray<typeof modifiers>['items']>, 'id' | 'internalId'>
  ) => {
    const mIdx = modifiers.findIndex((mm) =>
      m.id ? mm.id == m.id : m.internalId == mm.internalId
    )
    const idx = modifiers[mIdx].items.findIndex((ii) =>
      i.id ? ii.id == i.id : ii.internalId == i.internalId
    )
    console.log(i.id)
    console.log(modifiers[mIdx])
    if (i.internalId) {
      modifiers[mIdx].items.splice(idx, 1)
      modifiers[mIdx].items = [...modifiers[mIdx].items]
    } else {
      modifiers[mIdx].items[idx].active = false
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

        {#if expanded && (expanded === m.internalId || expanded === m.id) && modifierTypes.find((t) => t.type == m.type)?.tree}
          <div class="flex-grow w-full px-4 pb-4 overflow-x-auto">
            <div
              class="divide-y border rounded-lg flex flex-col w-full relative overflow-x-auto dark:divide-gray-700 dark:border-gray-700"
            >
              <table
                class="text-sm text-left w-full text-gray-500 dark:text-gray-400"
              >
                <thead
                  class="bg-gray-50 text-xs text-gray-700 uppercase !z-30 dark:bg-gray-700 dark:text-gray-400"
                  class:sr-only={!m.items?.filter((m) => m.active).length}
                >
                  <tr>
                    <th
                      scope="col"
                      class="py-3 px-6"
                      class:sr-only={!m.items?.filter((m) => m.active).length}
                      >{m.type === 'color' ? 'Color' : 'Title'}</th
                    >
                    <th
                      scope="col"
                      class="py-3 px-6"
                      class:sr-only={!m.items?.filter((m) => m.active).length}
                      >Cost</th
                    >
                    <th
                      scope="col"
                      class="py-3 px-6"
                      class:sr-only={!m.items?.filter((m) => m.active).length}
                      >Cost as percentage</th
                    >
                    <th scope="col" class="py-3 px-6">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="z-10 relative">
                  {#each m.items?.filter((i) => i.active) as i}
                    <tr
                      in:fly|local={{ x: -20 }}
                      class="bg-white dark:bg-gray-800"
                      class:border-b={idx !==
                        m?.items?.filter((m) => m.active).length - 1}
                      class:dark:border-gray-700={idx !==
                        m?.items?.filter((m) => m.active).length - 1}
                    >
                      <th
                        scope="row"
                        class="flex font-bold h-full min-h-64px py-4 px-6 text-gray-900 whitespace-nowrap items-center dark:text-white"
                      >
                        {#if m.type === 'color'}
                          <input
                            type="color"
                            required
                            bind:value={i.name}
                            class="m-auto"
                          />
                        {:else}
                          <input
                            type="text"
                            placeholder="Item title"
                            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none <sm:w-24ch dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                            required
                            bind:value={i.name}
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
                        />
                      </td>
                      <td class="py-4 px-6">
                        <input
                          type="checkbox"
                          class="mx-auto"
                          bind:checked={i.percentage}
                        />
                      </td>
                      <td class="text-right py-4 px-6">
                        <button
                          class="border-transparent rounded flex border-2 p-1 duration-200 hover:border-gray-300"
                          title="Delete"
                          use:tooltip
                          on:click={() => deleteItem(m, i)}
                          type="button"><TrashCan16 /></button
                        >
                      </td>
                    </tr>
                  {:else}
                    <tr
                      class="bg-gray-50 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >
                      <td class="text-center py-4 px-6" colspan="5">
                        <div
                          class="flex space-x-2 w-full justify-center items-center"
                        >
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
