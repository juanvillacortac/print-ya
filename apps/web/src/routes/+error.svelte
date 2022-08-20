<script lang="ts">
  import { page } from '$app/stores'
  import { layoutData } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import Searchbar from '$lib/__storefront/Searchbar.svelte'
  import { Copy16 } from 'carbon-icons-svelte'
</script>

{#if $page.status === 404 && $layoutData.layout === 'store' && $layoutData.store}
  <div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
    <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
      <a href="/" class="hover:underline">Home</a>
      <span>/</span>
      <p>404 Not Found</p>
    </div>
    <div class="flex flex-col">
      <h3
        class="flex font-bold font-title text-$sc-color-primary text-6xl items-center dark:text-white"
      >
        Whoops!
      </h3>
      <p class="text-dark-900 text-2xl dark:text-white">
        We can't find the page you requested (sorry)...
      </p>
    </div>
    <p class="font-bold text-$sc-color-primary text-2xl dark:text-white">
      BUT don't fret... Here are 4 tips for finding it...
    </p>
    <div class="flex flex-col space-y-12 pt-12">
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4 items-center">
          <div
            class="bg-$sc-color-primary rounded-full flex font-bold font-title h-12  text-white text-lg w-12 items-center justify-center"
          >
            1
          </div>
          <p class="text-lg"><span class="font-bold">Search</span> for it...</p>
        </div>
        <Searchbar />
      </div>
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4">
          <div
            class="bg-$sc-color-primary rounded-full flex font-bold font-title text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
          >
            2
          </div>
          <p class="text-lg pt-3">
            <span class="font-bold">If you typed in a URL...</span>
            make sure the spelling, cApitALiZaTiOn, and punctuation are correct.
            Then try reloading the page.
          </p>
        </div>
      </div>
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4">
          <div
            class="bg-$sc-color-primary rounded-full flex font-bold font-title text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
          >
            3
          </div>
          <p class="text-lg pt-3">
            <span class="font-bold"
              >Search using one of the collections below:</span
            >
          </p>
        </div>
        <div class="w-full grid gap-6 sm:grid-cols-2 lg:px-16 lg:grid-cols-4">
          {#each $layoutData.store.categories || [] as c}
            <a
              href="/products?category={c.slug}"
              class="flex flex-col space-y-4 duration-200 hover:text-red-500"
              sveltekit:prefetch
            >
              <div
                class="bg-black flex font-bold font-title text-white text-center w-full p-6 text-3xl aspect-square items-center justify-center"
              >
                {c.name}
              </div>
              <div class="font-bold text-center">{c.name}</div>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div
    class="flex flex-col min-h-screen space-y-4 p-4 text-dark-900 items-center justify-center dark:text-gray-100"
    class:-m-4={$layoutData.layout === 'app'}
    class:lg:-m-6={$layoutData.layout === 'app'}
  >
    <div class="font-bold text-6xl leading-[0.7]">
      {$page.error.status || $page.status}
    </div>

    <p class="font-bold my-4">{$page.error.name}</p>

    <p class="my-4">{$page.error.message}</p>

    {#if $page.error.stack}
      <div class="w-full max-h-[35vh] relative lg:w-6/10">
        <div class="top-2 right-2 absolute">
          <button
            title="Copy"
            use:tooltip
            on:click={() => navigator.clipboard.writeText($page.error.stack)}
            class="border rounded flex bg-gray-100 border-gray-300 shadow-lg opacity-50 p-2 duration-200 dark:bg-gray-800 dark:border-gray-600 hover:opacity-100"
          >
            <Copy16 />
          </button>
        </div>
        <pre
          class="border rounded-md bg-gray-100 border-gray-300 p-2 overflow-auto dark:bg-gray-900 dark:border-gray-600">{$page
            .error.stack}</pre>
      </div>
    {/if}
  </div>
{/if}
