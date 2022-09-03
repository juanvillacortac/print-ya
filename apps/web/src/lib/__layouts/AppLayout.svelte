<script lang="ts">
  import { navigating, page } from '$app/stores'
  import { preferences, layoutData } from '$lib'
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
    UserAvatar24,
    Analytics24,
  } from 'carbon-icons-svelte'
  import Favicons from '$lib/components/Favicons.svelte'
  import { pageSubtitle } from '$lib/stores'
  import Transition from './Transition.svelte'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'
  import { beforeNavigate } from '$app/navigation'
  import { fade, fly, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import trpc from '$lib/trpc/client'
  import { writable } from 'svelte/store'
  import { setContext } from 'svelte'
  import { api } from '@shackcart/shared'
  import { portal } from 'svelte-portal'
  import { browser } from '$app/environment'

  $: path = $page.url.pathname
  $: store = $layoutData.store

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
        icon: UserAvatar24,
        title: 'Customers',
        href: `/stores/${store?.slug}/customers`,
      },
      {
        icon: Analytics24,
        title: 'Analytics',
        href: `/stores/${store?.slug}/analytics`,
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

  $: pageTitle =
    ($page.data.title ? $page.data.title + ' | ' : '') + 'ShackCart'

  let sidebar = false

  let el: HTMLDivElement | undefined
  let gradientVisible = false
  const navHeight = writable(0)

  setContext('navHeight', navHeight)

  $: if (el) {
    gradientVisible = el.clientWidth < el.scrollWidth
  }

  const scroll = () => {
    if (!el) return
    gradientVisible = el.offsetWidth + el.scrollLeft < el?.scrollWidth
  }

  let spinnerTimer: NodeJS.Timeout | undefined
  let showSpinner = false
  function startSpinner() {
    spinnerTimer = setTimeout(() => {
      showSpinner = true
    }, 200)
  }
  function stopSpinner() {
    showSpinner = false
    clearTimeout(spinnerTimer)
  }

  $: if ($navigating) {
    startSpinner()
  } else {
    stopSpinner()
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#if showSpinner || !browser}
  <div
    class="cursor-wait flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 400, easing: expoOut }}
    use:portal
  >
    <div class="bg-black h-full w-full opacity-70 absolute" />
    <div class="lds-ring">
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
{/if}

{#if browser}
  {#if $page.data.user && !$page.data.hideLayout}
    <Favicons
      favicon="/images/logo.svg"
      themeColor="#000"
      titleName="ShackCart"
      description={$page.data.description}
    />

    <div class="flex flex-col h-screen w-full overflow-hidden">
      <div class="flex h-full w-full">
        <div
          class="bg-white border-t flex flex-col border-light-900 w-full  bottom-0 left-0 text-gray-400 z-60 fixed justify-between sm:hidden dark:bg-gray-900 dark:border-gray-700"
        >
          {#if gradientVisible}
            <div
              class="bg-gradient-to-r from-transparent to-white h-full top-0 right-0 w-96px z-20 absolute pointer-events-none dark:to-gray-900"
              transition:fly|local={{ x: 10, duration: 200 }}
            />
          {/if}
          <div
            class="w-full overflow-auto relative no-scrollbar"
            bind:this={el}
            bind:clientHeight={$navHeight}
            on:scroll={scroll}
          >
            <div class="flex space-x-4 m-4 w-full">
              <a
                class="flex h-24px min-h-24px min-w-24px w-24px relative items-center justify-center"
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
                  in:scale|local={{
                    start: 0.8,
                    duration: 400,
                    easing: expoOut,
                  }}
                  data-sveltekit-prefetch
                  class:text-black={current}
                  class:dark:text-white={current}
                  href={p.href}
                  style="width: 24px; height: 24px"
                  on:click={() => (sidebar = false)}
                >
                  <div class="flex space-x-2">
                    <svelte:component this={p.icon} />
                  </div>
                </a>
              {/each}
              <button
                on:click={() =>
                  ($preferences.darkMode = !$preferences.darkMode)}
                class="flex relative hover:text-black dark:hover:text-white"
                title="Toggle theme"
                use:tooltip
                style="min-width: 24px; min-height: 24px"
              >
                <div class="absolute pointer-events-none">
                  <svelte:component
                    this={$preferences.darkMode ? Moon24 : Sun24}
                  />
                </div>
              </button>
              <button
                on:click={() => {
                  api.del('/login', {}).then(() => {
                    // if (!logout) return
                    if ($page.url.pathname.startsWith('/account')) {
                      window.location.replace('/login')
                    } else {
                      window.location.reload()
                    }
                  })
                }}
                class="flex relative hover:text-black dark:hover:text-white"
                title="Log out"
                use:tooltip
                style="min-width: 24px; min-height: 24px"
              >
                <Logout24 />
              </button>
            </div>
          </div>
        </div>
        <div
          class="bg-white border-r flex flex-col h-full  border-light-900 p-4 text-gray-400 z-60 justify-between sidebar dark:bg-gray-900 dark:border-gray-700"
          class:open={sidebar}
        >
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
                data-sveltekit-prefetch
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
                <svelte:component
                  this={$preferences.darkMode ? Moon24 : Sun24}
                />
              </div>
            </button>
            <button
              on:click={() => {
                api.del('/login', {}).then(() => {
                  // if (!logout) return
                  if ($page.url.pathname.startsWith('/account')) {
                    window.location.replace('/login')
                  } else {
                    window.location.reload()
                  }
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
          {#if store}
            <div
              class="flex mb-6 items-center sm:space-x-4"
              in:fly={{ y: -5, duration: 600, easing: expoOut }}
            >
              <a
                class="flex <sm:hidden"
                title="Go back"
                data-sveltekit-prefetch
                use:tooltip
                href={$page.data.backLink ||
                  $page.url.pathname.substring(
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
                    href={$page.data.backLink ||
                      $page.url.pathname.substring(
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
            <div class="flex-grow <lg:pb-$nh" style:--nh="{$navHeight}px">
              <slot />
            </div>
          </Transition>
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
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

  .lds-ring {
    display: flex;
    position: relative;
    width: 32px;
    height: 32px;
  }
  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 32px;
    height: 32px;
    margin: 0px;
    border: 4px solid currentColor;
    border-radius: 50%;
    animation: lds-ring 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
