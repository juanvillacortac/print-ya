<script>
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
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

  $: path = $page.url.pathname

  const pages = [
    {
      icon: Home24,
      title: 'Dashboard',
      href: '/app/dashboard',
    },
    {
      icon: Store24,
      title: 'Stores',
      href: '/app/stores',
    },
    {
      icon: Settings24,
      title: 'User settings',
      href: '/app/settings',
    },
  ]

  $: showLayout = !path.split('/').includes('ide')
</script>

{#if showLayout}
  <div class="flex flex-col h-screen w-full overflow-hidden">
    <div class="flex h-full w-full">
      <div
        class="bg-white border-r flex flex-col h-full space-y-6 border-light-900 p-4 text-gray-400 z-20 justify-between dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex flex-col h-full space-y-6">
          <a class="relative" href="/" title="Home" use:tooltip>
            <div
              class="rounded-lg h-auto bg-gray-100 -left-4px w-[calc(100%+8px)] absolute dark:bg-gray-800"
              style="aspect-ratio: 1/1"
            />
            <h1
              class="font-logo font-black text-transparent text-center text-2xl select-none pointer-events-none rainbow-bg relative !bg-clip-text"
            >
              PY!
            </h1>
          </a>
          {#each pages as p}
            <a
              title={p.title}
              use:tooltip
              class="flex hover:text-black dark:hover:text-white"
              class:text-black={path?.startsWith(p.href)}
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
              del(`/login`, {}).then(() => {
                notifications.send('Log out successfully', 'default', 1000)
                goto('/login')
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
        class="h-full bg-light-500 w-full p-6 overflow-auto dark:bg-gray-900"
      >
        <slot />
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}
