<script>
  import { page, session } from '$app/stores'
  import { preferences } from '$lib'
  import { notifications } from '$lib/components/notifications'
  import { tooltip } from '$lib/components/tooltip'
  import {
    Store24,
    Home24,
    Moon24,
    Sun24,
    Settings24,
    Logout24,
    ChevronLeft20,
    Launch16,
    ChevronLeft24,
    Category24,
    Product24,
    ColorPalette24,
    OrderDetails24,
  } from 'carbon-icons-svelte'
  import Favicons from '$lib/components/Favicons.svelte'
  import { pageSubtitle } from '$lib/stores'
  import Transition from './Transition.svelte'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'
  import { beforeNavigate } from '$app/navigation'
  import { fly, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import trpc from '$lib/trpc/client'

  $: path = $page.url.pathname
  $: store = $page.stuff.store

  $: pages = {
    none: [
      {
        icon: Home24,
        title: 'Dashboard',
        href: '/',
      },
      {
        icon: Store24,
        title: 'Stores',
        href: '/stores',
      },
      {
        icon: Settings24,
        title: 'User settings',
        href: '/settings',
      },
    ],
    stores: [
      {
        icon: Home24,
        title: ` ${store?.name} Dashboard`,
        href: `/stores/${store?.slug}`,
      },
      {
        icon: Category24,
        title: 'Categories',
        href: `/stores/${store?.slug}/categories`,
      },
      {
        icon: Product24,
        title: 'Products',
        href: `/stores/${store?.slug}/products`,
      },
      {
        icon: OrderDetails24,
        title: 'Orders',
        href: `/stores/${store?.slug}/orders`,
      },
      {
        icon: ColorPalette24,
        title: 'Customize storefront',
        href: `/stores/${store?.slug}/customization`,
      },
      {
        icon: Settings24,
        title: 'Store settings',
        href: `/stores/${store?.slug}/settings`,
      },
    ],
  }

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  beforeNavigate(() => {
    $pageSubtitle = ''
  })

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + 'ShackCart'

  let sidebar = false
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons favicon="/images/logo.svg" themeColor="#000" titleName="ShackCart" />

{#if $session.userId}
  <div class="flex flex-col h-screen w-full overflow-hidden">
    <div class="flex h-full w-full">
      <div
        class="bg-white border-r flex flex-col h-full  border-light-900 p-4 text-gray-400 z-60 justify-between sidebar dark:bg-gray-900 dark:border-gray-700"
        class:open={sidebar}
      >
        <div
          class="opacity-50 right-[calc(-52px-16px)] bottom-4 absolute sm:hidden"
        >
          <button
            class="rounded-full outline-none bg-blue-500 shadow text-white p-4"
            on:click={() => (sidebar = !sidebar)}
          >
            <ChevronLeft20
              class="transform duration-400 {!sidebar ? 'rotate-180' : ''}"
            />
          </button>
        </div>
        <div class="flex flex-col h-full space-y-6">
          <a
            class="flex h-24px w-24px relative items-center justify-center"
            href="/"
            title="Home"
            use:tooltip
          >
            <div
              class="rounded-lg h-auto bg-gray-100 -left-4px w-[calc(100%+8px)] absolute dark:bg-gray-800"
              style="aspect-ratio: 1/1"
              use:squareratio
            />

            <svg
              viewBox="0 0 50 39"
              class="h-full m-auto w-full relative"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
                class="ccompli1  !dark:fill-white"
                fill="#007AFF"
              />
              <path
                d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
                class="ccustom  !dark:fill-white"
                fill="#312ECB"
              />
            </svg>
            <!-- <h1
              class="font-logo font-black text-transparent text-center text-2xl select-none pointer-events-none rainbow-bg relative !bg-clip-text"
            >
              PY!
            </h1> -->
          </a>
          {#each store ? pages['stores'] : pages['none'] as p (p.href)}
            {@const current =
              p.href === '/' || p.href === `/stores/${store?.slug}`
                ? path === '/' || path === `/stores/${store?.slug}`
                : path?.startsWith(p.href)}
            <a
              title={p.title}
              use:tooltip
              class="flex hover:text-black dark:hover:text-white"
              in:scale|local={{ start: 0.8, duration: 400, easing: expoOut }}
              sveltekit:prefetch
              class:text-black={current}
              class:dark:text-white={current}
              href={p.href}
              on:click={() => (sidebar = false)}
            >
              <div class="flex space-x-2">
                <svelte:component this={p.icon} />
                <span class="sm:hidden">{p.title}</span>
              </div>
            </a>
          {/each}
        </div>
        <div
          class="flex sm:flex-col sm:space-y-6 <sm:space-x-6 <sm:items-center"
        >
          <button
            on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
            class="flex relative hover:text-black dark:hover:text-white"
            title="Toggle theme"
            use:tooltip
            style="width: 24px; height: 24px"
          >
            <div class="absolute pointer-events-none">
              <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
            </div>
          </button>
          <button
            on:click={() => {
              trpc()
                .mutation('user:logout')
                .then(() => {
                  notifications.send('Log out successfully', 'default', 1000)
                  window.location.replace('/login')
                })
            }}
            class="flex relative items-end justify-end hover:text-black dark:hover:text-white"
            title="Log out"
            use:tooltip
            style="width: 24px; height: 24px"
          >
            <Logout24 />
          </button>
        </div>
      </div>
      <div
        class="h-full bg-light-500 w-full p-4 overflow-auto lg:p-6 dark:bg-gray-900"
      >
        {#if $page.stuff.store}
          {@const store = $page.stuff.store}
          <div
            class="flex mb-6 items-center sm:space-x-4"
            in:fly={{ y: -5, duration: 600, easing: expoOut }}
          >
            <a
              class="flex <sm:hidden"
              title="Go back"
              sveltekit:prefetch
              use:tooltip
              href={$page.url.pathname.substring(
                0,
                $page.url.pathname.lastIndexOf('/')
              )}><ChevronLeft24 class="flex" /></a
            >
            <div
              class="flex mr-auto items-start sm:space-x-4 sm:items-center <sm:flex-col <sm:space-y-4"
            >
              <a
                href="/stores/{store.slug}"
                class="border rounded bg-light-100 border-blue-500 p-1 dark:bg-gray-100"
              >
                <Image
                  src={store.logo || ''}
                  options={{
                    q: 100,
                  }}
                  class="h-2rem"
                />
              </a>
              <div class="flex items-center">
                <a
                  class="flex mr-4 sm:hidden"
                  title="Go back"
                  use:tooltip
                  href={$page.url.pathname.substring(
                    0,
                    $page.url.pathname.lastIndexOf('/')
                  )}><ChevronLeft24 /></a
                >
                <a
                  class="font-bold font-title text-black text-xl dark:text-white"
                  href="/stores/{store.slug}"
                >
                  {store.name}
                </a>
                <a
                  class="border-transparent flex ml-4 hover:border-current"
                  href={getAbsoluteURL({
                    subdomain: !store.customDomain ? store.slug : undefined,
                    host: store.customDomain || undefined,
                  })}
                  target="__blank"
                  title="Go to site"
                  use:tooltip
                >
                  <Launch16 />
                </a>
              </div>
            </div>
          </div>
        {/if}
        <Transition url={$page.url.pathname}>
          <slot />
        </Transition>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  @media (max-width: 639.9px) {
    .sidebar:not(.open) {
      transform: translateX(-100%);
    }
    .sidebar {
      @apply transition-transform top-0 left-0 duration-400 fixed;
    }
  }
</style>
