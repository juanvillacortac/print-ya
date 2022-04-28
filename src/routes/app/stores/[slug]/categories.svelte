<script lang="ts">
  import { page } from '$app/stores'
  import type { Store } from '$lib/db'

  $: store = $page.stuff.store as Store
  $: categories = store.categories

  let editMap: Record<string, string> = {}
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Categories
  </h3>
  <div class="shadow relative overflow-x-auto sm:rounded-lg">
    <table class="text-sm text-left w-full text-gray-500 dark:text-gray-400">
      <thead
        class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 px-6"> Name </th>
          <th scope="col" class="py-3 px-6"> Products count </th>
          <th scope="col" class="py-3 px-6">
            <span class="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each categories as c, idx}
          <tr
            class="bg-white dark:bg-gray-800"
            class:border-b={idx !== categories.length - 1}
            class:dark:border-gray-700={idx !== categories.length - 1}
          >
            <th
              scope="row"
              class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
            >
              {#if editMap[c.id] || editMap[c.id] === ''}
                <input
                  type="text"
                  bind:value={editMap[c.id]}
                  class="bg-transparent border-none text-sm py-0 px-0 appearance-none focus:outline-none"
                />
              {:else}
                {c.name}
              {/if}
            </th>
            <td class="py-4 px-6">{c._count.templates} products</td>
            <td class="text-right py-4 px-6">
              <button
                on:click={() =>
                  editMap[c.id] || editMap[c.id] === ''
                    ? (editMap[c.id] = null)
                    : (editMap[c.id] = c.name)}
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >{editMap[c.id] || editMap[c.id] === ''
                  ? 'Save'
                  : 'Edit'}</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
