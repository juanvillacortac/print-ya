<script context="module" lang="ts">
  import type { Load } from "@sveltejs/kit";
  import { get } from "$lib/api";
  import Image from "$lib/components/caravaggio/Image.svelte";
  import { tooltip } from "$lib/components/tooltip";
  import { Launch16 } from "carbon-icons-svelte";
  import type { Store } from "$lib/db";

  export const load: Load = async ({ params, fetch, session }) => {
    const stuff = await get<{ store: Store }>(`/api/stores/${params.slug}`, {
      fetch,
    });
    if (!stuff.store || stuff.store.userId !== session?.userId) {
      return {
        status: 404,
      };
    }

    return {
      stuff,
    };
  };
</script>

<script lang="ts">
  import { page } from "$app/stores";
  import { invalidate } from "$app/navigation";
  import { browser } from "$app/env";
  import { getAbsoluteURL } from "$lib/utils/host";

  let store: Store;
  $: store = $page.stuff.store;

  $: path = $page.url.pathname;
  $: if (path && store && browser) {
    invalidate(`/api/stores/${store.slug}`);
  }
</script>

<h2 class="font-bold font-title text-black mb-4 text-3xl dark:text-white">
  My Stores
</h2>
<div class="flex space-x-4 mb-6 items-center">
  <a
    class="flex <sm:space-y-4 sm:space-x-4 items-center <sm:flex-col"
    href="/stores/{store.slug}"
  >
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
    href={getAbsoluteURL({
      subdomain: !store.customDomain ? store.slug : undefined,
      host: store.customDomain,
    })}
    target="__blank"
    title="Go to site"
    use:tooltip
  >
    <Launch16 />
  </a>
</div>
<slot />
