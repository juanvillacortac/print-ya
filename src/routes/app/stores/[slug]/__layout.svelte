<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { get } from '$lib/api'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { Launch16 } from 'carbon-icons-svelte'

  export const load: Load = async ({ params, fetch }) => {
    const data = await get(`/api/stores/${params.slug}`, { fetch })
    if (!data.store)
      return {
        status: 404,
      }
    return {
      props: {
        ...data,
      },
      stuff: {
        ...data,
      },
    }
  }
</script>

<script>
  export let store
  import { page } from '$app/stores'
  import { invalidate } from '$app/navigation'
  import { browser } from '$app/env'

  $: path = $page.url.pathname
  $: if (path && store && browser) {
    invalidate(`/api/stores/${store.slug}`)
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-3xl dark:text-white">
  My Stores
</h2>
<div class="flex space-x-4 mb-6 items-center">
  <a class="flex space-x-4 items-center" href="/app/stores/{store.slug}">
    <div class="rounded bg-light-100 shadow p-1 dark:bg-gray-800">
      <Image
        src={store.logo}
        options={{
          q: 100,
        }}
        class="h-2rem"
      />
    </div>
    <span class="font-bold font-title text-black text-xl dark:text-white">
      {store.name}
    </span>
  </a>
  <a
    class="border-transparent flex hover:border-current"
    href="/?store={store.slug}"
    target="__blank"
    title="Go to site"
    use:tooltip
  >
    <Launch16 />
  </a>
</div>
<slot />
