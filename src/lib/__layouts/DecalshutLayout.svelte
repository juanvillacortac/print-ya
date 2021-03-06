<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
  import { navigating, page, session } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import {
    Moon24,
    Search16,
    Sun24,
    ShoppingBag24,
    Favorite24,
    UserAvatar24,
    LogoInstagram24,
    LogoTwitter24,
    Logout16,
    Settings16,
    OrderDetails16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Store } from '$lib/db'
  import { bag, customer, pageSubtitle, preferences } from '$lib/stores'
  import { goto } from '$app/navigation'
  import Submenu from '$lib/components/Submenu.svelte'
  import trpc from '$lib/trpc/client'
  import { browser } from '$app/env'

  export let store: Store

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  $: if (!$navigating) {
    $pageSubtitle = ''
  }

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + store.name

  let search = ''
  let category = ''

  const submitSearch = async () => {
    await goto(getSearchUrl())
    search = ''
    category = ''
  }

  $: getSearchUrl = () => {
    const query = new URLSearchParams()
    query.set('search', search)
    query.set('category', category)
    return `/products?${query.toString()}`
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons
  favicon={store.favicon || ''}
  themeColor="#000"
  titleName={store.name || ''}
/>

<div
  class="flex flex-col min-h-screen top-0 left-0 text-gray-700 relative dark:text-white"
>
  <div
    class="bg-white flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg <sm:border-b !bg-opacity-90 dark:bg-gray-800 dark:border-gray-600"
  >
    <div
      class="flex mx-auto w-full p-4 py-2 justify-between items-center lg:w-9/10"
    >
      <div class="flex space-x-4 items-center">
        <a href="/" class="flex">
          <Image
            src={store.logo || ''}
            class="rounded-sm p-px h-2rem lg:h-3rem dark:bg-white dark:bg-opacity-20"
            options={{
              o: 'png',
              rs: {
                s: 'x48',
                m: 'scale',
              },
            }}
          />
        </a>
        <form
          class="flex py-2 <sm:hidden !text-xs"
          on:submit|preventDefault={submitSearch}
        >
          <input
            class="bg-white border border-red-900  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
            type="search"
            name="q"
            bind:value={search}
            placeholder="Enter keywords to search..."
          />
          <select
            class="bg-white border-b border-l-0 border-r-0 border-red-900  leading-tight py-2  px-3 w-10rem appearance-none <sm:hidden !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            bind:value={category}
          >
            <option value="">All products</option>
            {#each store.categories || [] as category}
              <option value={category.slug}>{category.name}</option>
            {/each}
          </select>
          <button class="flex bg-red-900  text-white p-2 items-center">
            <Search16 class="m-auto" />
          </button>
        </form>
      </div>
      <div class="flex space-x-2 text-gray-400 items-center lg:space-x-4">
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-black dark:hover:text-white"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="top-0 left-0 absolute pointer-events-none">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
        {#if browser}
          {#if $customer === null}
            <a
              class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
              title="Log in"
              href="/login?callbackUrl={encodeURIComponent(
                $page.url.pathname === '/login'
                  ? '/'
                  : `${$page.url.pathname}${
                      $page.url.searchParams.toString()
                        ? `?${$page.url.searchParams.toString()}`
                        : ''
                    }`
              )}"
              use:tooltip
            >
              <UserAvatar24 />
            </a>
          {:else}
            <Submenu>
              <div class="content" slot="button">
                {#if !$customer}
                  <div class="rounded-full h-32px w-32px skeleton" />
                {:else}
                  <div
                    class="bg-gradient-to-br border rounded-full cursor-pointer flex font-bold font-title from-green-300 to-pink-600 border-gray-200 h-32px text-white text-xs leading-[0] w-32px items-center justify-center uppercase dark:bg-gray-600 dark:from-green-400 dark:to-pink-700"
                  >
                    {$customer?.firstName[0]}
                  </div>
                {/if}
              </div>
              <div
                class="flex flex-col font-bold space-y-3 text-xs text-gray-800 items-end dark:text-white"
                slot="body"
              >
                {#if !$customer}
                  <p>Loading...</p>
                {:else}
                  <p>Hi, {$customer?.firstName}!</p>
                {/if}
                <a
                  class="flex font-normal space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  href="/account/orders"
                >
                  <span>Orders</span> <OrderDetails16 class="flex" /></a
                >
                <a
                  class="flex font-normal space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  href="/account/settings"
                >
                  <span>Settings</span> <Settings16 class="flex" /></a
                >
                <button
                  class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  on:click={() => {
                    trpc()
                      .mutation('customer:logout')
                      .then((logout) => {
                        if (!logout) return
                        if ($page.url.pathname.startsWith('/account')) {
                          window.location.replace('/login')
                        } else {
                          window.location.reload()
                        }
                      })
                  }}
                  type="button"
                >
                  <span>Log out</span> <Logout16 class="flex" /></button
                >
              </div>
            </Submenu>
          {/if}
        {:else}
          <div class="rounded-full h-32px w-32px skeleton" />
        {/if}
        <a
          class="flex relative hover:text-pink-500"
          title="Favorites"
          use:tooltip
          href="/favorites"
          style="width: 24px; height: 24px"
        >
          <Favorite24 />
        </a>
        <a
          class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
          title="Shopping Bag"
          href="/bag"
          use:tooltip
        >
          <ShoppingBag24 />
          <p class="font-bold text-xs text-right w-[3ch] <lg:hidden">
            {$bag.length || 0}
          </p>
        </a>
      </div>
    </div>
    <form
      class="flex p-4 py-2 pb-4 sm:hidden !text-xs"
      on:submit|preventDefault={submitSearch}
    >
      <input
        class="bg-white border border-red-900  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline focus:z-10"
        type="search"
        name="q"
        bind:value={search}
        placeholder="Enter keywords to search..."
      />
      <select
        class="bg-white border-b border-l-0 border-r-0 border-red-900  leading-tight py-2  px-3 w-14rem appearance-none !border-t dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
        bind:value={category}
      >
        <option value="">All categories</option>
        {#each store.categories || [] as category}
          <option value={category.slug}>{category.name}</option>
        {/each}
      </select>
      <button class="flex bg-red-900  text-white p-2 items-center">
        <Search16 class="m-auto" />
      </button>
    </form>
    <div class="bg-red-900 text-white text-base w-full <lg:hidden">
      <div class="flex mx-auto space-x-4 text-white p-4 py-2 lg:w-9/10">
        <a href="/" class="hover:underline">Home</a>
        {#each store.categories?.slice(0, 7) || [] as category}
          <a class="hover:underline" href="/products?category={category.slug}"
            >{category.name}</a
          >
        {/each}
        <a class="hover:underline" href="/contact">Contact</a>
        <a class="hover:underline" href="/faq">FAQ</a>
      </div>
    </div>
    <div class="flex bg-[#00fff4] w-full p-4 py-2 items-center justify-center">
      <div class="text-dark-900 <sm:text-xs">Create a Custom Text Decal</div>
    </div>
  </div>

  <div class="flex-grow">
    <slot />
  </div>

  <div class="bg-red-300 w-full text-gray-500 dark:(text-white bg-red-700) ">
    <div
      class="flex flex-col m-auto space-y-3 w-full p-4 items-center lg:w-8/10"
    >
      <Image
        src={$page.stuff.store?.favicon || ''}
        class="w-32px"
        options={{
          rs: {
            s: '32x',
          },
        }}
      />
      <p class="font-bold text-sm text-center sm:text-lg">
        All trademarks not owned by <i>{$page.url.host}</i> that appear on this
        site are the property of their respective owners, who may or may not be
        affiliated with, connected to, or sponsored by <i>{$page.url.host}</i> or
        its subsidiaries.
      </p>
    </div>
  </div>
  <div class="bg-red-900 w-full">
    <div
      class="divide-white mx-auto text-white w-full grid grid-cols-1 lg:divide-x-1 lg:w-9/10 lg:grid-cols-4 <lg:divide-y-1"
    >
      <div class="flex-col h-full space-y-4 p-4 justify-center items-center">
        <h4 class="font-bold font-title">Stay In The Loop</h4>
        <div class="flex items-center">
          <input
            class="bg-white border-0 h-32px text-xs leading-tight w-full py-2 px-3 appearance-none !text-gray-800 lg:w-20rem focus:outline-none focus:shadow-outline focus:z-10"
            type="search"
            name="q"
            placeholder="Enter your email address"
          />
          <button
            class="flex font-bold h-full bg-red-400 text-white text-xs p-2 items-center uppercase"
          >
            Submit
          </button>
        </div>
        <p class="font-light italic">
          Become a Decals Hut Insider and get 10% off your order today. Plus
          we'll keep you up-to-date with the latest designs.
        </p>
      </div>
      <div class="grid p-4 grid-cols-2 grid-rows-4">
        <a href="/">Home</a>
        {#each store.categories?.slice(0, 7) || [] as category}
          <a href="/products?category={category.slug}" class="hover:underline"
            >{category.name}</a
          >
        {/each}
        <a href="/products" class="hover:underline">More products</a>
        <a href="/faq" class="hover:underline">FAQ</a>
      </div>
      <div class="w-full <lg:hidden" />
      <div
        class="flex-col flex h-full space-y-4 p-4 items-center justify-center "
      >
        <h4 class="font-bold font-title text-center">Secure Checkout</h4>
        <p class="text-center">
          We use encrypted SSL security to ensure that your credit card
          information is 100% protected.
        </p>
        <Image
          src="https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/ff-checkout-single.png?v=151997186021135005011631037864"
          class="mx-auto"
          options={{
            rs: {
              s: '200x',
            },
          }}
        />
      </div>
    </div>
  </div>
  <div class="bg-gray-900 w-full !text-white">
    <div
      class="flex mx-auto text-xs w-full p-4 justify-between items-center <sm:flex-col <sm:space-y-4 <sm:items-center lg:w-9/10"
    >
      <p>
        &copy; {new Date().getFullYear()}
        {$page.stuff.store?.name}. All rights reserved.
      </p>
      <div class="flex space-x-4 items-center">
        <a
          href="https://twitter.com/decalshutca"
          target="__blank"
          class="duration-200 !hover:text-gray-400"
        >
          <LogoTwitter24 />
        </a>
        <a
          href="https://www.instagram.com/decalshutca"
          target="__blank"
          class="duration-200 !hover:text-gray-400"
        >
          <LogoInstagram24 />
        </a>
      </div>
    </div>
  </div>
</div>
