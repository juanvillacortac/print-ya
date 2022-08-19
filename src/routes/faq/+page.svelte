<script lang="ts">
  import { pageSubtitle } from '$lib'
  import SvelteMarkdown from 'svelte-markdown'
  import { browser } from '$app/env'
  import type { PageData } from './$types'

  $: $pageSubtitle = `FAQ`

  export let data: PageData
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
      <SvelteMarkdown source={data.content} />
    {/key}
  </div>
</div>

<style>
  .faq-content :global(p) {
    @apply text-sm;
  }

  .faq-content :global(a) {
    @apply font-bold;
    color: var(--sc-color-primary);
  }
  :global(.dark) .faq-content :global(a) {
    @apply text-red-500;
  }
  .faq-content :global(a:hover) {
    @apply underline;
  }
</style>
