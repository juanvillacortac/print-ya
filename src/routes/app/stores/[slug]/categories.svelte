<script lang="ts">
  import { invalidate } from '$app/navigation'

  import { page } from '$app/stores'
  import { post } from '$lib/api'
  import { notifications } from '$lib/components/notifications'
  import type { Store } from '$lib/db'
  import type { StoreCategory } from '@prisma/client'

  let store: Store
  $: store = $page.stuff.store as Store
  $: categories = store.categories

  let selected: StoreCategory = {
    id: '',
    name: '',
    slug: '',
    storeId: store?.id,
  }

  const saveCategory = async () => {
    try {
      const _ = await post<StoreCategory>(
        `/api/stores/${store.slug}/categories`,
        {
          ...selected,
          storeId: store.id,
        }
      )
      notifications.send(
        'Category ' + (selected.id ? 'updated' : 'created'),
        'default',
        3000
      )
      await invalidate(`/api/stores/${store.slug}`)
    } catch ({ message }) {
      notifications.send(message, 'default', 3000)
    }
    selected = {
      id: '',
      name: '',
      slug: '',
      storeId: store.id,
    }
  }
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Categories
  </h3>
  <div class="flex space-x-4 justify-between items">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
      type="text"
      placeholder="Category name"
      bind:value={selected.name}
    />
    <button
      class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
      disabled={!selected?.name}
      on:click={saveCategory}>{selected?.id ? 'Save' : 'Create'}</button
    >
  </div>
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
              {c.name}
            </th>
            <td class="py-4 px-6">{c._count.products} products</td>
            <td class="text-right py-4 px-6">
              <button
                disabled={selected.id == c.id}
                on:click={() => (selected = c)}
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline disabled:opacity-70 disabled:pointer-not-allowed"
                >Edit</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
