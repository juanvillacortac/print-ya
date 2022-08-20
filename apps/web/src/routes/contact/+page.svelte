<script lang="ts">
  import { Close24, Email24, Email32, PhoneFilled24 } from 'carbon-icons-svelte'
  import { fade, fly } from 'svelte/transition'
  import { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'
  import trpc from '$lib/trpc/client'
  import { layoutData } from '$lib'

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
      storeId: $layoutData.store!.id,
    })
  }
</script>

{#if dialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-80 absolute"
      on:click={() => (dialog = false)}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-gray-900"
      style="will-change: transform"
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
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
  <div class="border-t flex border-gray-300 w-full dark:border-gray-600" />
  <p>Our helpful experts are on hand if you need them.</p>
  <div
    class="flex w-full lg:space-x-6 lg:justify-between lg:items-start <lg:flex-col <lg:space-y-6"
  >
    <div class="flex flex-col space-y-2 w-full lg:w-7/10">
      <h4 class="font-bold font-title text-xl">Contact form</h4>
      <form
        on:submit|preventDefault={submit}
        class="flex flex-col space-y-4 border-gray-300 w-full"
      >
        <div class="flex space-x-3">
          <div class="flex flex-col w-full">
            <input
              type="text"
              required
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
              placeholder="First name *"
              bind:value={firstName}
            />
          </div>
          <div class="flex flex-col w-full">
            <input
              type="text"
              required
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
              placeholder="Last name *"
              bind:value={lastName}
            />
          </div>
        </div>
        <div class="flex space-x-3">
          <div class="flex flex-col w-full">
            <input
              type="email"
              placeholder="Enter Your Email Address *"
              required
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
              bind:value={email}
            />
          </div>
          <div class="flex flex-col w-full">
            <input
              type="tel"
              placeholder="Contact Number *"
              required
              class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline "
              bind:value={phone}
            />
          </div>
        </div>
        <div class="flex flex-col w-full">
          <textarea
            placeholder="Message *"
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
            class="bg-$sc-color-primary rounded flex font-bold space-x-2 shadow text-white text-xs py-2 px-4 transform duration-200 items-center justify-self-end disabled:cursor-not-allowed hover:not-disabled:scale-105"
            style="will-change: transform"
          >
            Send message
          </button>
        </div>
      </form>
    </div>
    {#if $layoutData.store?.contactData?.email || $layoutData.store?.contactData?.phone}
      <div class="flex flex-col space-y-2 w-full lg:w-3/10">
        <h4 class="font-bold font-title text-xl">Contact us</h4>
        <div
          class="border rounded flex flex-col space-y-4 border-gray-300 w-full p-4 dark:border-gray-600"
        >
          <div class="flex flex-col space-y-2">
            <div class="font-bold text-sm">Availability:</div>
            <p class="text-xs">Mon-Sun 8am-7pm Eastern</p>
          </div>
          <ul class="space-y-2">
            {#if $layoutData.store?.contactData?.phone}
              <li class="flex space-x-2 items-center">
                <PhoneFilled24 class="text-$sc-color-primary" />
                <a
                  href="tel:{$layoutData.store.contactData.phone}"
                  class="font-bold text-sm hover:underline"
                  >{$layoutData.store.contactData.phone}</a
                >
              </li>
            {/if}
            {#if $layoutData.store?.contactData?.email}
              <li class="flex space-x-2 items-center">
                <Email24 class="text-$sc-color-primary" />
                <a
                  href="mailto:{$layoutData.store.contactData.email}"
                  class="font-bold text-sm hover:underline"
                  >{$layoutData.store.contactData.email}</a
                >
              </li>
            {/if}
          </ul>
          <div class="flex flex-col">
            <p class="text-xs">Physical Mailing Address</p>
            <p class="text-xs">77 James St N, Hamilton, ON L8R 2K3</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <p class="text-xl pt-6">
    Please check our <a
      href="/faq"
      class="text-black transition-colors duration-400 dark:font-bold dark:text-white hover:text-red-800"
      >frequently asked questions and answers page</a
    >.
  </p>
</div>
