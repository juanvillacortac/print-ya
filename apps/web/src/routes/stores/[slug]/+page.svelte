<script lang="ts">
  import { layoutData } from '$lib'
  import {
    Analytics32,
    Category32,
    ColorPalette32,
    OrderDetails32,
    Product32,
    Settings32,
    UserAvatar32,
  } from 'carbon-icons-svelte'

  $: actions = [
    {
      icon: Category32,
      title: 'Categories',
      href: `/categories`,
    },
    {
      icon: Product32,
      title: 'Products',
      href: `/products`,
    },
    {
      icon: OrderDetails32,
      title: 'Orders',
      href: `/orders`,
    },
    {
      icon: UserAvatar32,
      title: 'Customers',
      href: `/customers`,
    },
    {
      icon: Analytics32,
      title: 'Analytics',
      href: `/analytics`,
    },
    {
      icon: ColorPalette32,
      title: 'Customize storefront',
      href: `/customization`,
    },
    {
      icon: Settings32,
      title: 'Store settings',
      href: `/settings`,
    },
  ]
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Actions
  </h3>

  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
    {#each actions as a}
      <a
        class="bg-white border rounded-lg flex flex-col h-full space-y-2 border-gray-300 w-full p-4 transform transition-transform duration-200 relative overflow-hidden items-center dark:bg-gray-800 dark:border-gray-600 hover:scale-105"
        href="/stores/{$layoutData.store?.slug}{a.href}"
        style="will-change: transform"
      >
        <svelte:component this={a.icon} />
        <h4 class="font-title font-bold text-black dark:text-white">
          {a.title}
        </h4>
      </a>
    {/each}
  </div>
</div>
