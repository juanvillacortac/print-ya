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
  let error = ''
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
  <form
    class="border rounded-lg flex flex-col mx-auto space-y-4 border-gray-300 w-full p-4 items-center lg:w-3/10 dark:border-gray-600"
    on:submit|preventDefault={submitCustomer}
  >
    {#if c}
      <div
        class="bg-gradient-to-br border rounded-full flex font-bold font-title from-green-300 to-pink-600 border-gray-200 h-72px text-white text-4xl leading-[0] w-72px items-center justify-center uppercase dark:bg-gray-600 dark:from-green-400 dark:to-pink-700"
      >
        {$customer?.firstName[0]}
      </div>
    {:else}
      <div class="rounded-full h-72px w-72px skeleton" />
    {/if}

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
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="flex flex-col font-bold space-y-2 text-xs w-full">
        <span> First name * </span>
        {#if c}
          <input
            type="text"
            placeholder="Enter your first name"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.firstName}
          />
        {:else}
          <div class="rounded h-33px w-full skeleton" />
        {/if}
      </label>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="flex flex-col font-bold space-y-2 text-xs w-full">
        <span> Last name * </span>
        {#if c}
          <input
            type="text"
            placeholder="Enter your last name"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.lastName}
          />
        {:else}
          <div class="rounded h-33px w-full skeleton" />
        {/if}
      </label>
    </div>
    <div class="flex space-x-2 w-full items-center">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="flex flex-col font-bold space-y-2 text-xs w-full">
        <span> Email * </span>
        {#if c}
          <input
            type="email"
            placeholder="Ex. example@domain.com"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.email}
          />
        {:else}
          <div class="rounded h-33px w-full skeleton" />
        {/if}
      </label>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="flex flex-col font-bold space-y-2 text-xs w-full">
        <span> Phone number * </span>
        {#if c}
          <input
            type="tel"
            placeholder="Ex. +1 XXXXXX"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={c.phoneNumber}
          />
        {:else}
          <div class="rounded h-33px w-full skeleton" />
        {/if}
      </label>
    </div>
    <button
      class="rounded flex font-bold bg-red-900 text-center text-sm w-full py-2 px-6 transform-gpu duration-200 justify-center items-center !text-white hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
      disabled={loading || !c}
      type="submit"
      >{loading ? 'Saving...' : c ? 'Save changes' : 'Loading...'}</button
    >
  </form>
</div>
