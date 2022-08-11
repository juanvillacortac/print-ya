<script context="module">
  /** @type {import('@sveltejs/kit').Load} */
  export function load({ error, status }) {
    console.log(error)
    return {
      props: {
        error,
        status, // same as status: status
      },
    }
  }
</script>

<script lang="ts">
  import { goto } from '$app/navigation'

  import { page } from '$app/stores'
  import Searchbar from '$lib/__storefront/Searchbar.svelte'

  export let error: Error
  export let status: number

  let search = ''
  let category = ''

  const submitSearch = async () => {
    await goto(getSearchUrl())
    search = ''
    category = ''
  }

  $: getSearchUrl = () => {
    const query = new URLSearchParams()
    query.set('search', search)
    query.set('category', category)
    return `/products?${query.toString()}`
  }
</script>

{#if status === 404 && $page.stuff.layout === 'store' && $page.stuff.store}
  <div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
    <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
      <a href="/" class="hover:underline">Home</a>
      <span>/</span>
      <p>404 Not Found</p>
    </div>
    <div class="flex flex-col">
      <h3
        class="flex font-bold font-title text-red-900 text-6xl items-center dark:text-white"
      >
        Whoops!
      </h3>
      <p class="text-dark-900 text-2xl dark:text-white">
        We can't find the page you requested (sorry)...
      </p>
    </div>
    <p class="font-bold text-red-900 text-2xl dark:text-white">
      BUT don't fret... Here are 4 tips for finding it...
    </p>
    <div class="flex flex-col space-y-12 pt-12">
      <div class="flex flex-col space-y-4">
        <div class="flex space-x-4 items-center">
          <div
            class="rounded-full flex font-bold font-title bg-red-900 h-12  text-white text-lg w-12 items-center justify-center"
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
            class="rounded-full flex font-bold font-title bg-red-900 text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
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
            class="rounded-full flex font-bold font-title bg-red-900 text-white  text-lg min-h-12 min-w-12 max-w-12 max-h-12 items-center justify-center"
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
          {#each $page.stuff.store?.categories || [] as c}
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
  <div class="font-bold text-6xl">
    {status}
  </div>

  <p class="my-4">{error.name}</p>

  <p class="my-4">{error.message}</p>

  {#if error.stack}
    <pre>{error.stack}</pre>
  {/if}
{/if}
