<script lang="ts">
  import { tooltip } from '$lib/components/tooltip'
  import ProductsGroupsList from '$lib/__app/ProductsGroupsList.svelte'
  import { Add24 } from 'carbon-icons-svelte'
  import { getContext } from 'svelte'
  import Portal from 'svelte-portal'
  import type { Writable } from 'svelte/store'

  const navHeight: Writable<number> = getContext('navHeight')
</script>

<h2 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
  Products groups
</h2>

<Portal>
  <div
    class="flex space-x-2 right-4 bottom-4 z-20 fixed items-center <lg:bottom-[calc(1rem+var(--nh))]"
    style:--nh="{$navHeight}px"
  >
    <a
      class="rounded-full flex bg-blue-500 shadow-lg text-white p-3 transform duration-200 hover:scale-95"
      title="Add a new group"
      href="groups/new"
      use:tooltip
    >
      <Add24 />
    </a>
  </div>
</Portal>

<div class="pb-14">
  <ProductsGroupsList />
</div>
