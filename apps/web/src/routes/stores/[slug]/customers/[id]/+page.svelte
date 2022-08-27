<script lang="ts">
  import { layoutData } from '$lib'
  import OrdersList from '$lib/__app/OrdersList.svelte'
  import { page } from '$app/stores'
  import { tooltip } from '$lib/components/tooltip'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div class="flex flex-col mx-auto space-y-4">
  <h3
    class="flex font-bold font-title text-black text-xl mb-4 items-center dark:text-white"
  >
    Customer #
    <span class="flex ml-2 w-6ch">
      <p
        class="rounded cursor-pointer font-normal bg-gray-100 text-xs p-1 transform whitespace-nowrap overflow-ellipsis overflow-hidden dark:bg-gray-600 hover:overflow-visible "
        title="Copy to clipboard"
        on:click={() => navigator.clipboard.writeText(data.customer.id)}
        use:tooltip
      >
        {data.customer.id}
      </p>
    </span>
  </h3>
  <div class="w-full grid gap-4 grid-cols-1 lg:grid-cols-10">
    <div class="flex flex-col space-y-4 lg:col-span-7 <lg:row-start-2">
      <OrdersList
        urlPrefix="/stores/{$layoutData.store?.slug}/orders"
        customerId={$page.params.id}
        small
      />
    </div>
    <div class="flex flex-col h-full space-y-4 w-full relative lg:col-span-3">
      <div
        class="bg-white border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 top-0 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
      >
        <div
          class="bg-gradient-to-br border rounded-full flex font-bold font-title mx-auto from-green-300 to-pink-600 border-gray-200 h-72px text-white text-4xl leading-[0] w-72px items-center justify-center uppercase dark:bg-gray-600 dark:from-green-400 dark:to-pink-700"
        >
          {data.customer.firstName[0]}
        </div>
        <p class="font-bold font-title text-black text-center dark:text-white">
          {data.customer.firstName}
          {data.customer.lastName}
          <br />
          <a
            class="font-normal text-xs hover:underline"
            href="mailto:{data.customer.email}">{data.customer.email}</a
          >
        </p>
        <div class="flex w-full items-center justify-between">
          <p
            class="font-bold font-title text-black text-left text-xs dark:text-white"
          >
            Registered at
            <br />
            <span class="font-normal"
              >{data.customer.createdAt.toLocaleString()}</span
            >
          </p>
          <p
            class="font-bold font-title text-black text-right text-xs dark:text-white"
          >
            Phone number
            <br />
            <a
              class="font-normal hover:underline"
              href="tel:{data.customer.phoneNumber}"
              >{data.customer.phoneNumber}</a
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
