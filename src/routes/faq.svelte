<script lang="ts" context="module">
  import {
    PUBLIC_UPSTASH_REDIS_TOKEN,
    PUBLIC_UPSTASH_REDIS_URL,
  } from '$env/static/public'
  export const load = async ({ stuff }) => {
    const redis = new Redis({
      url: PUBLIC_UPSTASH_REDIS_URL,
      token: PUBLIC_UPSTASH_REDIS_TOKEN,
    })

    const content =
      (await redis.get<{ json: string }>(`storeFaq:${stuff.store?.id || ''}`))
        ?.json || ''
    return {
      props: {
        content,
      },
    }
  }
</script>

<script lang="ts">
  import { pageSubtitle } from '$lib'
  import SvelteMarkdown from 'svelte-markdown'
  import { browser } from '$app/env'
  import { Redis } from '@upstash/redis'

  $: $pageSubtitle = `FAQ`

  export let content: string

  const source = `
<store-accordion title="Where are you located?">
    <p>Hamilton, Ontario, Canada</p>
</store-accordion>

<store-accordion title="Where are your products made?">
    <p>Hamilton, Ontario, Canada & our material is manufactured in U.S.A</p>
</store-accordion>

<store-accordion title="Do you ship worldwide?">
    <p>Yes, we do ;)</p>
</store-accordion>

<store-accordion title="Can I pickup locally?">
    <p>No sorry, we are currently mail order only. NO EXCEPTIONS</p>
</store-accordion>

<store-accordion title="Can I call you and place a custom order?">
    <p>No sorry, we are currently mail order only. NO EXCEPTIONS</p>
</store-accordion>

If you have anymore questions, please [contact us](/contact)
`
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>FAQ</p>
  </div>
  <h3
    class="flex font-bold font-title text-black text-3xl items-center dark:text-white"
  >
    FAQ
  </h3>
  <div class="font-bold mx-auto text-center lg:w-7/10">
    <h1 class="text-base lg:text-lg">
      <span class="bg-[#ffff00] p-1 text-gray-700">
        UNDER NO CIRCUMSTANCE WILL WE CALL OR REQUEST ADDITIONAL PAYMENT AFTER
        YOUR PURCHASE HAS BEEN ALREADY PLACED.
      </span>
    </h1>
  </div>
  <div class="flex flex-col space-y-4 faq-content">
    {#key browser}
      <SvelteMarkdown source={content} />
    {/key}
  </div>
</div>

<style>
  .faq-content :global(p) {
    @apply text-sm;
  }

  .faq-content :global(a) {
    @apply font-bold text-$sc-color-primary;
  }
  :global(.dark) .faq-content :global(a) {
    @apply text-red-500;
  }
  .faq-content :global(a:hover) {
    @apply underline;
  }
</style>
