<script lang="ts">
  import 'bytemd/dist/index.css'
  import { page } from '$app/stores'
  import type { Product, Store } from '$lib/db'
  const store = $page.stuff.store as Store
  import { Editor } from 'bytemd'
  import { post } from '$lib/api'

  const plugins = [
    // gfm(),
    // Add more plugins here
  ]

  export let product: Partial<Product> = {
    price: 0.01,
    public: true,
    isTemplate: false,
  }

  const submit = async () => {
    try {
      const data = await post(`/api/stores/${store.slug}/products`, {
        ...product,
        template: '',
        templateDraft: '',
        storeId: store.id,
      })
      alert('fine')
      console.log(data)
    } catch (err) {
      console.log(err.message, err.error)
    }
  }
</script>

<form
  on:submit|preventDefault|stopPropagation={submit}
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-9/10"
>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col">
    <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
      {product.id ? product.name : 'New product'}
    </h3>
    <div
      class="flex justify-end items-end lg:space-x-6 lg:items-center <lg:flex-col <lg:space-y-4 <lg:hidden"
    >
      <div class="flex space-x-4 items-center">
        <input
          type="checkbox"
          id="isTemplate"
          bind:checked={product.isTemplate}
        />
        <label class="font-bold text-xs block" for="isTemplate">
          Is a template
        </label>
      </div>
      <div class="flex space-x-4 items-center">
        <input type="checkbox" id="published" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div>
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        >Save</button
      >
    </div>
  </div>
  <div
    class="flex flex-col space-y-4 w-full lg:flex-row lg:space-y-0 lg:space-x-4 lg:justify-between lg:items-start"
  >
    <div class="flex flex-col space-y-6 w-full">
      <div
        class="bg-white rounded-xl flex flex-col h-full space-y-4 shadow w-full p-4 relative overflow-hidden <lg:pb-12 dark:bg-gray-800"
      >
        <div class="flex items-center lg:space-x-4 <lg:flex-col <lg:space-y-4">
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Product name
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Ex. Red camera sign"
              required
              bind:value={product.name}
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Product category
            </label>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={product.storeCategoryId}
            >
              {#each store.categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="font-bold text-sm mb-2 block" for="fieldId">
              Price
            </label>
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="number"
              min={0.01}
              step="any"
              bind:value={product.price}
            />
          </div>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-sm mb-2 block" for="fieldId">
            Description
          </label>
          <Editor
            value={product.description || ''}
            {plugins}
            on:change={(e) => (product.description = e.detail.value)}
          />
        </div>
      </div>
    </div>
    <div
      class="flex justify-end items-end lg:space-x-6 lg:items-center lg:hidden <lg:flex-col <lg:space-y-4"
    >
      <div class="flex space-x-4 items-center">
        <input type="checkbox" bind:checked={product.isTemplate} />
        <label class="font-bold text-xs block" for="isTemplate">
          Is a template
        </label>
      </div>
      <div class="flex space-x-4 items-center">
        <input type="checkbox" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div>
      <button
        class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        >Save</button
      >
    </div>
  </div>
</form>
