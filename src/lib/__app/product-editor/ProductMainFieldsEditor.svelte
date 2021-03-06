<script lang="ts">
  import { page } from '$app/stores'
  import { tooltip } from '$lib/components/tooltip'

  import type { Product } from '$lib/db'
  import type { InferQueryOutput } from '$lib/trpc/client'
  import trpc from '$lib/trpc/client'
  import { Editor } from 'bytemd'
  import {
    Add16,
    ChevronRight16,
    Close16,
    CloseOutline16,
    Information16,
  } from 'carbon-icons-svelte'
  import cuid from 'cuid'
  import { flip } from 'svelte/animate'
  import { expoOut } from 'svelte/easing'
  import { fly, scale, slide } from 'svelte/transition'

  export let product: Partial<Product>
  $: store = $page.stuff.store
  let showing = false
  let tagInput = ''

  let tags: InferQueryOutput<'products:listTags'> = []

  let timeout: NodeJS.Timeout
  let findingTags = false
  function searchTags() {
    const find = async () => {
      tags = (
        await trpc().query('products:listTags', {
          name: tagInput || undefined,
          storeId: $page.stuff.store?.id || '',
        })
      ).filter((t) => !product.tags?.some((pt) => pt.id === t.id))
      findingTags = false
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => find(), 500)
    findingTags = true
  }

  function deleteTags() {
    tags = []
    findingTags = false
  }

  $: if (tagInput && tagInput.trim().length > 1) {
    searchTags()
  } else {
    deleteTags()
  }
</script>

<div
  class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
>
  <div class="flex w-full justify-between items-center">
    <div class="flex space-x-4 items-center">
      <button
        class="rounded flex p-1 duration-200"
        title="Show/hide items"
        use:tooltip
        on:click={() => (showing = !showing)}
        type="button"
        ><ChevronRight16
          class="transform duration-200 transition-transform {showing
            ? 'rotate-90'
            : ''}"
        /></button
      >
      <h3 class="font-bold text-xs block">Product fields</h3>
    </div>
  </div>
  {#if showing}
    <div
      class="flex flex-col space-y-4 <lg:pb-12"
      transition:slide|local={{ duration: 400, easing: expoOut }}
    >
      <div class="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Product name
          </label>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="text"
            placeholder="Ex. Red camera sign"
            required
            disabled={product.archived}
            bind:value={product.name}
          />
        </div>
        {#if !product.id}
          <div class="flex flex-col w-full">
            <label class="font-bold text-xs mb-2 block" for="fieldId">
              Product type
            </label>
            <select
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              bind:value={product.type}
            >
              <option value={'generic'}>Static product</option>
              <option value={'template'}>Custom design</option>
              <option value={'template_pro'}>Custom design (advanced)</option>
            </select>
          </div>
        {/if}
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Product category
          </label>
          <select
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={product.storeCategoryId}
            disabled={product.archived}
          >
            <option value={null}>-- No category --</option>
            {#each store?.categories || [] as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Price
          </label>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="number"
            min={0.01}
            step="any"
            disabled={product.archived}
            bind:value={product.price}
          />
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Minimum order quantity
          </label>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="number"
            min={0}
            disabled={product.archived}
            bind:value={product.minQuantity}
          />
        </div>
        <div class="flex flex-col space-y-2 w-full">
          <p class="font-bold text-xs">Tags</p>
          <div class="z-30 relative">
            <input
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Search or create a tag"
              bind:value={tagInput}
            />
            {#if tagInput?.length > 1}
              <div
                class="bg-white rounded divide-y-1 divide-gray-300 border-2 border-gray-300 shadow-lg text-xs leading-tight w-full max-h-40 top-10 left-0 absolute appearance-none overflow-auto !border-blue-600 dark:divide-gray-600 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                transition:fly|local={{ y: 5, duration: 200 }}
              >
                {#if (!findingTags && !product.tags?.find((t) => t.name === tagInput)) || findingTags}
                  <div
                    class="flex w-full py-2 px-3 justify-between items-center hover:bg-gray-200 hover:dark:bg-gray-800"
                    on:click={() => {
                      if (findingTags) return
                      product.tags = [
                        {
                          id: cuid(),
                          name: tagInput,
                        },
                        ...(product.tags || []),
                      ]
                      tagInput = ''
                    }}
                  >
                    {#if !findingTags}
                      <div class="font-bold text-xs">Create tag</div>
                      <Add16 />
                    {:else}
                      <div class="font-bold text-xs">Searching...</div>
                    {/if}
                  </div>
                {:else if !tags.length}
                  <div
                    class="flex w-full py-2 px-3 justify-between items-center"
                  >
                    <div class="font-bold text-xs">Nothing found</div>
                  </div>
                {/if}
                {#each tags as tag}
                  <div
                    class="flex w-full py-2 px-3 justify-between items-center hover:bg-gray-200 hover:dark:bg-gray-800"
                    on:click={() => {
                      product.tags = [tag, ...(product.tags || [])]
                      tagInput = ''
                    }}
                  >
                    <div class="text-xs">{tag.name}</div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          <div
            class="border rounded flex flex-wrap border-gray-300 w-full p-4px dark:(bg-gray-700 border-gray-600) "
          >
            {#if !product.tags?.length}
              <div
                class="flex space-x-2 w-full p-2 text-gray-600 justify-center items-center dark:text-gray-400"
              >
                <Information16 />
                <p class="font-bold text-xs whitespace-nowrap">Without tags</p>
              </div>
            {:else}
              {#each product.tags as tag (tag.id)}
                <div
                  class="p-2px"
                  in:scale={{ start: 0.8, duration: 200 }}
                  animate:flip={{ duration: 200 }}
                >
                  <button
                    type="button"
                    class="rounded flex space-x-1 bg-gray-100 text-xs p-1 transform text-dark-900 duration-200 items-center dark:bg-gray-900 dark:text-white hover:scale-95"
                    style="will-change: transform"
                    title="Delete tag"
                    use:tooltip
                    on:click={() => {
                      const tmp = [...(product.tags || [])]
                      const idx = tmp.findIndex((t) => t.id === tag.id)
                      tmp.splice(idx, 1)
                      product.tags = [...tmp]
                      tagInput = ''
                    }}
                  >
                    <Close16 class="h-18px w-18px dark:text-gray-500" />
                    <span class="font-bold">
                      {tag.name}
                    </span>
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full">
        <label class="font-bold text-xs mb-2 block" for="fieldId">
          Description
        </label>
        <Editor
          value={product.description || ''}
          on:change={(e) => (product.description = e.detail.value)}
        />
      </div>
    </div>
  {/if}
</div>
