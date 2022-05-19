<script>
  import { page, session, navigating } from '$app/stores'
  import { preferences } from '$lib'
  import { del } from '$lib/api'
  import { notifications } from '$lib/components/notifications'
  import { tooltip } from '$lib/components/tooltip'
  import {
    Store24,
    Home24,
    Moon24,
    Sun24,
    Settings24,
    Logout24,
  } from 'carbon-icons-svelte'
  import Favicons from '$lib/components/Favicons.svelte'
  import { pageSubtitle } from '$lib/stores'
  import { fly } from 'svelte/transition'
  import Transition from './Transition.svelte'
  import { squareratio } from '$lib/actions/aspectratio'

  $: path = $page.url.pathname

  const pages = [
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
  ]

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  $: if (!$navigating) {
    $pageSubtitle = ''
  }

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + 'Print Ya!'
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons favicon="/images/logo.svg" themeColor="#000" titleName="Print Ya!" />

{#if $session.userId}
  <div class="flex flex-col h-screen w-full overflow-hidden">
    <div class="flex h-full w-full">
      <div
        class="bg-white border-r flex flex-col h-full space-y-6 border-light-900 p-4 text-gray-400 z-20 justify-between dark:bg-gray-900 dark:border-gray-800"
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
            <!-- <h1
              class="font-logo font-black text-transparent text-center text-2xl select-none pointer-events-none rainbow-bg relative !bg-clip-text"
            >
              PY!
            </h1> -->
          </a>
          {#each pages as p}
            <a
              title={p.title}
              use:tooltip
              class="flex hover:text-black dark:hover:text-white"
              sveltekit:prefetch
              class:text-black={p.href === '/'
                ? path === '/'
                : path?.startsWith(p.href)}
              class:dark:text-white={path?.startsWith(p.href)}
              href={p.href}
            >
              <svelte:component this={p.icon} />
            </a>
          {/each}
        </div>
        <div class="flex flex-col space-y-6">
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
              del(`/api/login`, {}).then(() => {
                notifications.send('Log out successfully', 'default', 1000)
                window.location.replace('/login')
              })
            }}
            class="flex relative justify-self-end self-end hover:text-black dark:hover:text-white"
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
        <Transition url={$page.url.pathname}>
          <slot />
        </Transition>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}
