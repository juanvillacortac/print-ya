<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
  import { navigating, page } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import {
    Moon24,
    Sun24,
    ShoppingBag24,
    Favorite24,
    UserAvatar24,
    LogoInstagram24,
    LogoTwitter24,
    Logout16,
    Settings16,
    OrderDetails16,
    Link16,
    View16,
    ViewOff16,
    ColorPalette16,
    Close24,
    Menu24,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import {
    bag,
    createLayoutStore,
    customer,
    layoutData,
    preferences,
  } from '$lib'
  import Submenu from '$lib/components/Submenu.svelte'
  import trpc from '$lib/trpc/client'
  import { browser } from '$app/env'
  import Searchbar from '$lib/__storefront/Searchbar.svelte'
  import { getContext } from 'svelte'
  import ElementEditor from '$lib/__app/ElementEditor.svelte'
  import type { Writable } from 'svelte/store'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { portal } from 'svelte-portal'
  import { api } from '@shackcart/shared'

  $: pageTitle =
    ($page.data.title ? $page.data.title + ' | ' : '') +
      $layoutData.store?.name || 'ShackCart'

  const customizable = getContext('customizable') || false
  const layoutStore: Writable<StoreData> =
    getContext('layout-store') ||
    createLayoutStore({
      initialState: $layoutData.storeData,
    })

  function whiteForeground(hex: string) {
    const rgb = hexToRgb(hex)
    const { r = 0, g = 0, b = 0 } = rgb ? rgb : {}
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (r * 0.299 + g * 0.587 + b * 0.114 > 150) return false
    else return true
    if (L > 0.179) return false
    return true
  }

  function hexToRgb(hex: string) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b
    })

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  let open = false
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons
  favicon={$layoutData.store?.favicon || ''}
  description={$page.data.description}
  themeColor="#000"
  titleName={$layoutData.store?.name || 'ShackCart'}
/>

<div
  class="flex flex-col min-h-screen top-0 left-0 text-gray-700 relative dark:text-white"
  style:--sc-color-primary={$layoutStore.theme.primary}
  style:--sc-auto-foreground={whiteForeground($layoutStore.theme.primary)
    ? '#fff'
    : '#000'}
  style:--sc-auto-foreground-invert={whiteForeground($layoutStore.theme.primary)
    ? '#000'
    : '#fff'}
>
  {#if open}
    <div
      class="flex h-full bg-dark-900 w-full inset-0 text-gray-100 z-99 fixed"
      use:portal
      transition:fly={{ duration: 400, y: -25, easing: expoOut }}
    >
      <div
        class="flex flex-col font-bold font-title mx-auto space-y-6 text-lg w-full p-4 items-end lg:w-9/10"
      >
        <div class="flex h-28px items-center">
          <button on:click={() => (open = false)} type="button">
            <Close24 class="flex" />
          </button>
        </div>
        {#each $layoutStore.header.links as _, idx}
          <ElementEditor
            readOnly={!customizable}
            root={layoutStore}
            keys={{
              href: `header.links[${idx}].href`,
              text: `header.links[${idx}].title`,
            }}
            removeButton
            compactButtons
            on:remove={() => {
              const tmp = [...$layoutStore.header.links]
              tmp.splice(idx, 1)
              $layoutStore.header.links = [...tmp]
            }}
            let:href
            let:text
            let:editable
            let:contenteditable
          >
            {#if href?.startsWith('/')}
              <a
                {href}
                use:contenteditable
                class:hover:underline={!editable}
                sveltekit:prefetch>{@html text}</a
              >
            {:else}
              <a
                {href}
                use:contenteditable
                class:hover:underline={!editable}
                target="_blank">{@html text}</a
              >
            {/if}
          </ElementEditor>
        {/each}
        {#if customizable && $layoutStore.header?.links?.length < 10}
          <button
            type="button"
            on:click={() => {
              $layoutStore.header.links = [
                ...$layoutStore.header.links,
                {
                  title: `Link ${$layoutStore.header.links.length + 1}`,
                  href: '/',
                },
              ]
            }}
            class="rounded-full font-bold ml-auto space-x-1 bg-gray-100 text-xs py-1 px-2 text-dark-900 inline-flex items-center justify-start hover:underline"
            title="Add link"
            use:tooltip
            ><span>Add link</span>
            <Link16 class="flex" /></button
          >
        {/if}
      </div>
    </div>
  {/if}
  <div
    class="bg-white flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg <sm:border-b !bg-opacity-90 dark:bg-gray-800 dark:border-gray-600"
    class:!border-b={!customizable &&
      !$layoutStore.header.links.length &&
      !$layoutStore.announcementBar.visible}
  >
    <div
      class="flex mx-auto w-full p-4 py-2 justify-between items-center lg:w-9/10"
    >
      <div class="flex items-center">
        {#if customizable || $layoutStore.header.links.length}
          <button
            class="pr-2 text-dark-900 lg:hidden dark:text-gray-100"
            on:click={() => (open = true)}
            type="button"
          >
            <Menu24 />
          </button>
        {/if}
        <div class="flex space-x-4 items-center">
          <a href="/" class="flex" sveltekit:prefetch>
            <Image
              src={$layoutData.store?.logo || ''}
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
          <Searchbar class="<lg:hidden" />
        </div>
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
        {#if !customizable}
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
                      api.del('/login', {}).then(() => {
                        // if (!logout) return
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
    <Searchbar class="w-full px-4 pb-4 lg:hidden" />
    {#if customizable || $layoutStore.header.links.length}
      <div
        class="bg-$sc-color-primary text-$sc-auto-foreground text-base w-full <lg:hidden"
      >
        <div class="flex mx-auto space-x-4 p-4 py-2 itms-center lg:w-9/10">
          <!-- <a href="/" class="hover:underline">Home</a>
          {#each store.categories?.slice(0, 7) || [] as category}
            <a
              class="hover:underline"
              href={customizable ? '#' : `/products?category=${category.slug}`}
              >{category.name}</a
            >
          {/each}
          <a class="hover:underline" href={customizable ? '#' : '/contact'}
            >Contact</a
          >
          <a class="hover:underline" href={customizable ? '#' : '/faq'}>FAQ</a> -->
          {#each $layoutStore.header.links as _, idx}
            <ElementEditor
              readOnly={!customizable}
              root={layoutStore}
              keys={{
                href: `header.links[${idx}].href`,
                text: `header.links[${idx}].title`,
              }}
              removeButton
              compactButtons
              on:remove={() => {
                const tmp = [...$layoutStore.header.links]
                tmp.splice(idx, 1)
                $layoutStore.header.links = [...tmp]
              }}
              let:href
              let:text
              let:editable
              let:contenteditable
            >
              {#if href?.startsWith('/')}
                <a
                  {href}
                  use:contenteditable
                  class:hover:underline={!editable}
                  sveltekit:prefetch>{@html text}</a
                >
              {:else}
                <a
                  {href}
                  use:contenteditable
                  class:hover:underline={!editable}
                  target="_blank">{@html text}</a
                >
              {/if}
            </ElementEditor>
          {/each}
          {#if customizable && $layoutStore.header?.links?.length < 10}
            <button
              type="button"
              on:click={() => {
                $layoutStore.header.links = [
                  ...$layoutStore.header.links,
                  {
                    title: `Link ${$layoutStore.header.links.length + 1}`,
                    href: '/',
                  },
                ]
              }}
              class="rounded-full font-bold mr-auto mb-auto space-x-1 bg-gray-100 text-xs py-1 px-2 text-dark-900 inline-flex items-center justify-start hover:underline"
              title="Add link"
              use:tooltip
              ><span>Add link</span>
              <Link16 class="flex" /></button
            >
          {/if}
        </div>
      </div>
    {/if}
    {#if customizable || $layoutStore.announcementBar.visible}
      <div class="w-full relative">
        {#if customizable}
          <div
            class="flex h-full space-x-1 top-0 right-2 z-99 absolute items-center"
          >
            <button
              type="button"
              on:click={() =>
                document.getElementById(`announcement-bg`)?.click()}
              class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 relative dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
              title="Change background color"
              use:tooltip
            >
              <input
                id="announcement-bg"
                type="color"
                bind:value={$layoutStore.announcementBar.background}
                class="h-0 opacity-0 w-0 overflow-hidden absolute"
              />
              <ColorPalette16 class="h-12px w-12px" />
            </button>
            {#if $layoutStore.announcementBar.visible}
              <button
                type="button"
                on:click={() => ($layoutStore.announcementBar.visible = false)}
                class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
                title="Hide announcement bar"
                use:tooltip><ViewOff16 class="h-12px w-12px" /></button
              >
            {:else}
              <button
                type="button"
                on:click={() => ($layoutStore.announcementBar.visible = true)}
                class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
                title="Show announcement bar"
                use:tooltip><View16 class="h-12px w-12px" /></button
              >
            {/if}
          </div>
        {/if}
        <div
          class="flex w-full p-4 py-2 items-center justify-center relative"
          class:opacity-25={!$layoutStore.announcementBar.visible}
          class:pointer-events-none={!$layoutStore.announcementBar.visible}
          style="background-color: {$layoutStore.announcementBar
            .background}; color: {whiteForeground(
            $layoutStore.announcementBar.background
          )
            ? 'white'
            : 'black'}"
        >
          {#if customizable}
            <ElementEditor
              readOnly={!$layoutStore.announcementBar.visible}
              root={layoutStore}
              keys={{
                text: `announcementBar.text`,
                href: `announcementBar.href`,
              }}
              optionalHref
              let:text
              let:href
              let:contenteditable
            >
              <p
                class="<sm:text-xs"
                use:contenteditable
                class:hover:underline={href}
                class:hover:cursor-pointer={href}
              >
                {@html text}
              </p>
            </ElementEditor>
          {:else if $layoutStore.announcementBar.href}
            {#if $layoutStore.announcementBar.href.startsWith('/')}
              <a
                href={$layoutStore.announcementBar.href}
                sveltekit:prefetch
                class="<sm:text-xs hover:underline"
                >{@html $layoutStore.announcementBar.text}</a
              >
            {:else}
              <a
                href={$layoutStore.announcementBar.href}
                target="_blank"
                class="<sm:text-xs hover:underline"
                >{@html $layoutStore.announcementBar.text}</a
              >
            {/if}
          {:else}
            <p class="<sm:text-xs">
              {@html $layoutStore.announcementBar.text}
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex-grow">
    <slot />
  </div>

  <div class="bg-red-300 w-full text-gray-500 dark:(text-white bg-red-700) ">
    <div
      class="flex flex-col m-auto space-y-3 w-full p-4 items-center lg:w-8/10"
    >
      <Image
        src={$layoutData.store?.favicon || ''}
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
  <div class="bg-bg-$sc-color-primary w-full">
    <div
      class="divide-$sc-auto-foreground mx-auto text-$sc-auto-foreground w-full grid grid-cols-1 lg:divide-x-1 lg:w-9/10 lg:grid-cols-4 <lg:divide-y-1"
    >
      <div class="flex-col h-full space-y-4 p-4 justify-center items-center">
        <ElementEditor
          readOnly={!customizable}
          innerButtons
          root={layoutStore}
          keys={{
            text: `footer.submit.title`,
          }}
          let:text
          let:contenteditable
        >
          <h4 class="!font-bold !font-title" use:contenteditable>
            {@html text}
          </h4>
        </ElementEditor>
        <div class="flex items-center">
          <input
            class="bg-white border border-$sc-auto-foreground rounded-l h-32px text-xs leading-tight w-full py-2 px-3 appearance-none !text-gray-800 lg:w-20rem focus:outline-none focus:shadow-outline focus:z-10 "
            type="email"
            placeholder="Enter your email address"
          />
          <button
            class="border-r border-t border-b border-$sc-auto-foreground rounded-r flex font-bold bg-red-400 text-white text-xs min-h-32px px-2 items-center uppercase "
          >
            Submit
          </button>
        </div>
        <ElementEditor
          innerButtons
          readOnly={!customizable}
          root={layoutStore}
          keys={{
            text: `footer.submit.text`,
          }}
          let:text
          let:contenteditable
        >
          <p class="!font-light !italic" use:contenteditable>
            {@html text}
          </p>
        </ElementEditor>
      </div>
      <div
        class="grid p-4 grid-cols-2 grid-rows-4 relative items-start justify-start"
      >
        {#each $layoutStore.footer?.links || [] as _, idx}
          <ElementEditor
            readOnly={!customizable}
            root={layoutStore}
            keys={{
              href: `footer.links[${idx}].href`,
              text: `footer.links[${idx}].title`,
            }}
            removeButton
            on:remove={() => {
              const tmp = [...$layoutStore.footer.links]
              tmp.splice(idx, 1)
              $layoutStore.footer.links = [...tmp]
            }}
            let:href
            let:text
            let:editable
            let:contenteditable
          >
            {#if href?.startsWith('/')}
              <a
                {href}
                use:contenteditable
                class:hover:underline={!editable}
                sveltekit:prefetch>{@html text}</a
              >
            {:else}
              <a
                {href}
                use:contenteditable
                class:hover:underline={!editable}
                target="_blank">{@html text}</a
              >
            {/if}
          </ElementEditor>
        {/each}
        {#if customizable && $layoutStore.footer?.links?.length < 10}
          <button
            type="button"
            on:click={() => {
              $layoutStore.footer.links = [
                ...$layoutStore.footer.links,
                {
                  title: `Link ${$layoutStore.footer.links.length + 1}`,
                  href: '/',
                },
              ]
            }}
            class="rounded-full font-bold mr-auto mb-auto space-x-1 bg-gray-100 text-xs py-1 px-2 text-dark-900 inline-flex items-center justify-start hover:underline"
            title="Add link"
            use:tooltip
            ><span>Add link</span>
            <Link16 class="flex" /></button
          >
        {/if}
      </div>
      <div class="w-full <lg:hidden" />
      <div
        class="flex-col flex h-full space-y-4 p-4 items-center justify-center "
      >
        <ElementEditor
          readOnly={!customizable}
          root={layoutStore}
          keys={{
            text: `footer.appendix.title`,
          }}
          let:text
          let:contenteditable
        >
          <h4 class="!font-bold !font-title !text-center" use:contenteditable>
            {@html text}
          </h4>
        </ElementEditor>
        <ElementEditor
          innerButtons
          readOnly={!customizable}
          root={layoutStore}
          keys={{
            text: `footer.appendix.text`,
          }}
          let:text
          let:contenteditable
        >
          <p class="!text-center" use:contenteditable>
            {@html text}
          </p>
        </ElementEditor>
        {#if customizable}
          <ElementEditor
            readOnly={!customizable}
            root={layoutStore}
            on:remove={() => ($layoutStore.footer.appendix.img = '')}
            removeButton
            keys={{
              image: `footer.appendix.img`,
            }}
            let:image
          >
            {#if image}
              <Image
                src={image || ''}
                class="mx-auto"
                options={{
                  rs: {
                    s: '200x',
                  },
                }}
              />
            {:else}
              <div
                class="border-dashed border rounded font-bold font-title text-center text-xs p-2"
              >
                No image
              </div>
            {/if}
          </ElementEditor>
        {:else if $layoutStore.footer?.appendix?.img}
          <Image
            src={$layoutStore.footer?.appendix?.img}
            class="mx-auto"
            options={{
              rs: {
                s: '200x',
              },
            }}
          />
        {/if}
      </div>
    </div>
  </div>
  <div class="bg-gray-900 w-full !text-white">
    <div
      class="flex mx-auto text-xs w-full p-4 justify-between items-center <sm:flex-col <sm:space-y-4 <sm:items-center lg:w-9/10"
    >
      <p>
        &copy; {new Date().getFullYear()}
        {$layoutData.store?.name}. All rights reserved.
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
