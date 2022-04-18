<script context="module">
  import { writable } from 'svelte/store'
  export const height = writable(0)
  export const transparent = writable(false)
</script>

<script>
  import Burger from './Burger.svelte'
  import Sidebar from './Sidebar.svelte'
  import navigation from './links'
  import { preferences } from '$lib'
  import { fly } from 'svelte/transition'
  import Dropdown from './Dropdown.svelte'
  import { navigating } from '$app/stores'

  $: dark = $preferences.darkMode

  export let sidebar = false

  let navbar

  $: if (!$navigating) sidebar = false

  let y

  let isTransparent = $transparent
  let top = true

  const setHeight = (n) => {
    $height = n ? n.offsetHeight : 0
  }

  $: top = y <= $height || y === undefined
  $: isTransparent = $transparent && top
  $: setHeight(navbar)
</script>

<svelte:window bind:scrollY={y} on:resize={() => setHeight(navbar)} />

<header
  class="
      fixed z-10 w-full duration-200 {!isTransparent && top
    ? 'bg'
    : ''} pointer-events-none
    "
  class:shadow-md={y > 0 && top}
>
  <div class="pointer-events-auto">
    <Sidebar bind:open={sidebar} />
  </div>
  <div
    class="flex m-auto h-24 p-4 px-6 duration-200 items-center justify-between pointer-events-none"
    bind:this={navbar}
  >
    {#if top || sidebar}
      <nav
        class="flex pointer-events-auto"
        transition:fly|local={{ x: -50, duration: 400 }}
      >
        <a href="https://yescampus.io" title="Home" class="rounded-xl duration-100">
          <img
            src="/images/logo{dark ? '-white' : ''}.svg"
            class="h-16 transform duration-200 hover:scale-110"
            alt="logo"
          />
        </a>
      </nav>
    {/if}
    <div
      class="
          pointer-events-auto
          ml-auto
          items-center px-2 -mx-4 text-base flex font-title text-yes-gray-500 dark:text-yes-gray-300
          {isTransparent ? 'shadow-md glass' : ''}
        "
    >
      {#if top && !sidebar}
        <div
          class="items-center hidden lg:flex"
          transition:fly|local={{ x: -50, duration: 400 }}
        >
          {#each navigation as n}
            {#if n.header == undefined || n.header != false}
              {#if n.childrens}
                <Dropdown titulo={n.titulo} links={n.childrens} />
              {:else}
                <a href={n.href} class="mx-4 nav-link">{n.titulo}</a>
              {/if}
            {/if}
          {/each}
          <div class="flex text-base">
            <a
              class="mx-2 btn-secondary"
              href="https://yescampus.teachlr.com/#signin">Iniciar sesión</a
            >
            <a
              class="mx-2 btn-primary"
              href="https://yescampus.teachlr.com/#register">Regístrate</a
            >
          </div>
          <div
            class="border-l border-yes-gray-500 h-4 mx-2 duration-800 dark:border-white dark:border-yes-gray-300"
          />
          <button
            on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
            title="Change theme"
            class="focus:outline-none mx-4 cursor-pointer nav-link i jam:{$preferences.darkMode
              ? 'sun'
              : 'moon'}"
          />
        </div>
      {/if}
      <div
        class="{top && !sidebar
          ? 'lg:hidden'
          : ''} my-auto pointer-events-auto ml-auto"
        transition:fly|local={{ x: -50, duration: 400 }}
      >
        <Burger bind:open={sidebar} white={isTransparent} />
      </div>
    </div>
  </div>
</header>

<style windi:global>
  header {
    transition: all 0.3s ease-in-out;
  }

  .glass {
    transition: background-color 0.2s ease-in-out;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: saturate(200%) blur(10px);
  }

  .bg {
    background-color: white;
  }

  :global(.dark .bg) {
    background-color: rgb(30, 30, 30);
  }

  :global(.dark .glass) {
    background-color: rgba(10, 10, 10, 0.9);
    backdrop-filter: saturate(200%) blur(10px);
  }

  .nav-link {
    transition: border 0.2s ease-in-out, color 0s ease-in-out;
    margin-bottom: -2px;
    border-bottom: 2px solid transparent;
  }

  .nav-link:hover {
    margin-bottom: -2px;
    border-bottom: 2px solid #0273e3;
  }
</style>
