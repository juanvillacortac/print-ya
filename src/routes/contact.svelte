<script lang="ts">
  import { pageSubtitle } from '$lib'
  import { Close24, Email24, Email32, PhoneFilled24 } from 'carbon-icons-svelte'
  import { fade, scale } from 'svelte/transition'
  import { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import trpc from '$lib/trpc/client'
  import { page } from '$app/stores'

  $: $pageSubtitle = `Contact us`

  let dialog = false

  let firstName = ''
  let lastName = ''
  let email = ''
  let phone = ''
  let message = ''

  const submit = () => {
    dialog = true
    trpc().mutation('stores:marketing:sendContactEmail', {
      email,
      message,
      phone,
      name: `${firstName} ${lastName}`,
      storeId: $page.stuff.store!.id,
    })
  }
</script>

{#if dialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center"
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      transition:fade={{ duration: 400, easing: expoOut }}
      on:click={() => (dialog = false)}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-900"
      style="will-change: transform"
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Success
        </h4>
        <button on:click={() => (dialog = false)}><Close24 /></button>
      </div>
      <div class="flex space-x-4 items-center">
        <Email32 class="h-48px text-blue-500 w-48px" />
        <div class="flex flex-col space-y-2">
          <p class="font-bold">Your message was sent</p>
          <p class="text-sm text-gray-500">
            We do our best to reply in a timely manner. Please double-check your
            junk/spam folder
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>Contact</p>
  </div>
  <h3
    class="flex font-bold font-title text-black text-3xl items-center dark:text-white"
  >
    Get in touch
  </h3>
  <p>Our helpful experts are on hand if you need them.</p>
  <div
    class="flex w-full lg:space-x-6 lg:justify-between lg:items-start <lg:flex-col <lg:space-y-6"
  >
    <form
      on:submit|preventDefault={submit}
      class="border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 lg:w-6/10 dark:border-gray-600"
    >
      <h4 class="font-bold font-title text-xl">Contact form</h4>
      <div class="flex space-x-3">
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId"
            >First name *</label
          >
          <input
            type="text"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={firstName}
          />
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId"
            >Last name *</label
          >
          <input
            type="text"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={lastName}
          />
        </div>
      </div>
      <div class="flex space-x-3">
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Email *
          </label>
          <input
            type="email"
            placeholder="Ex. example@domain.com"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={email}
          />
        </div>
        <div class="flex flex-col w-full">
          <label class="font-bold text-xs mb-2 block" for="fieldId">
            Phone number *
          </label>
          <input
            type="tel"
            placeholder="Ex. +1 XXXXXX"
            required
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
            bind:value={phone}
          />
        </div>
      </div>
      <div class="flex flex-col w-full">
        <label class="font-bold text-xs mb-2 block" for="fieldId">
          Message *
        </label>
        <textarea
          placeholder="Write your message here (you can write markdown)"
          required
          class="bg-white border rounded border-gray-300 h-24 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          bind:value={message}
        />
      </div>
      <div class="flex space-x-2 w-full justify-between">
        <p class="font-bold text-xs text-gray-500 lg:w-2/4">
          We do our best to reply in a timely manner. Please double-check your
          junk/spam folder.
        </p>
        <button
          class="rounded flex font-bold space-x-2 bg-red-900 shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
          style="will-change: transform"
        >
          Send message
        </button>
      </div>
    </form>
    {#if $page.stuff.store?.contactData?.email || $page.stuff.store?.contactData?.phone}
      <div
        class="border rounded-lg flex flex-col space-y-4 border-gray-300 w-full p-4 lg:w-2/10 dark:border-gray-600"
      >
        <h4 class="font-bold font-title text-xl">Contact us</h4>
        <ul class="space-y-2">
          {#if $page.stuff.store?.contactData?.phone}
            <li class="flex space-x-2 items-center">
              <PhoneFilled24 class="text-red-900" />
              <a
                href="tel:{$page.stuff.store.contactData.phone}"
                class="font-bold text-sm hover:underline"
                >{$page.stuff.store.contactData.phone}</a
              >
            </li>
          {/if}
          {#if $page.stuff.store?.contactData?.email}
            <li class="flex space-x-2 items-center">
              <Email24 class="text-red-900" />
              <a
                href="mailto:{$page.stuff.store.contactData.email}"
                class="font-bold text-sm hover:underline"
                >{$page.stuff.store.contactData.email}</a
              >
            </li>
          {/if}
        </ul>
      </div>
    {/if}
  </div>
</div>
