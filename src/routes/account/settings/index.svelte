<script lang="ts">
  import { customer } from '$lib'
  import trpc from '$lib/trpc/client'
  import type { Customer } from '@prisma/client'
  import { expoOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'

  let c: Customer | undefined
  const setCustomer = () => {
    c = { ...$customer } as Customer
  }
  $: if ($customer) {
    setCustomer()
  }
  let error = 'Hola'
  let loading = false
  const submitCustomer = async () => {
    if (!c) return
    try {
      error = ''
      loading = true
      await trpc().mutation('customer:update', c)
      customer.invalidate()
    } catch ({ message }) {
      error = message
    } finally {
      loading = false
    }
  }
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>Account</p>
    <span>/</span>
    <a href="/acccount/settings" class="hover:underline">Settings</a>
  </div>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Account Settings
  </h3>
  {#if c}
    <form
      class="border rounded-lg flex flex-col mx-auto space-y-4 border-gray-300 p-4 items-center lg:w-3/10 dark:border-gray-600"
      on:submit|preventDefault={submitCustomer}
    >
      <div
        class="bg-gradient-to-br border rounded-full cursor-pointer flex font-bold font-title from-green-300 to-pink-600 border-gray-200 h-72px text-white text-4xl leading-[0] w-72px items-center justify-center uppercase dark:bg-gray-600 dark:from-green-400 dark:to-pink-700"
      >
        {$customer?.firstName[0]}
      </div>

      {#if error}
        <div
          class="text-xs w-full text-red-500"
          transition:slide|local={{ duration: 400, easing: expoOut }}
        >
          <span class="font-bold">Error:</span>
          {error}
        </div>
      {/if}
      <div class="flex space-x-2 w-full items-center">
        <label class="flex flex-col font-bold space-y-2 text-xs w-full">
          <span> First name * </span>
          <input
            type="text"
            placeholder="Ex. Gabriela Ivanovich"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.firstName}
          />
        </label>
        <label class="flex flex-col font-bold space-y-2 text-xs w-full">
          <span> Last name * </span>
          <input
            type="text"
            placeholder="Ex. Gabriela Ivanovich"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.lastName}
          />
        </label>
      </div>
      <div class="flex space-x-2 w-full items-center">
        <label class="flex flex-col font-bold space-y-2 text-xs w-full">
          <span> Email* </span>
          <input
            type="email"
            placeholder="Ex. gaby@gmail.com"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.email}
          />
        </label>
        <label class="flex flex-col font-bold space-y-2 text-xs w-full">
          <span> Phone number * </span>
          <input
            type="tel"
            placeholder="Ex. +1 2345678"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.phoneNumber}
          />
        </label>
      </div>
      <button
        class="rounded flex font-bold bg-red-900 text-center text-sm w-full py-2 px-6 transform-gpu duration-200 justify-center items-center !text-white hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
        disabled={loading}
        type="submit">{loading ? 'Saving...' : 'Save changes'}</button
      >
    </form>
  {/if}
</div>
