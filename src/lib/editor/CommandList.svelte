<script>
  import { portal } from 'svelte-portal'
  import { expoOut } from 'svelte/easing'

  import { fade, fly, slide } from 'svelte/transition'

  export let selectedIndex = 0
  import {
    slashVisible,
    slashItems,
    slashLocaltion,
    slashProps,
  } from './stores'

  let height = 0
  let wrapperHeight = 0

  let elements = []

  $: invert = ($slashLocaltion.y || 0) + wrapperHeight > height || 0
</script>

<svelte:window bind:innerHeight={height} />

{#if $slashVisible}
  <div
    class="h-screen w-full top-0 absolute"
    on:click={() => ($slashVisible = false)}
    use:portal
  />
  <div
    class="bg-white border rounded max-w-full border-gray-300 shadow max-h-72 w-96 z-999 absolute overflow-auto dark:bg-gray-800 dark:border-gray-600"
    use:portal
    transition:fly|local={{ duration: 200, y: 5, easing: expoOut }}
    bind:clientHeight={wrapperHeight}
    style="left: {$slashLocaltion.x}px; top: {invert
      ? $slashLocaltion.y - $slashLocaltion.height - 384
      : $slashLocaltion.y + $slashLocaltion.height}px;"
  >
    <div
      class="bg-white font-bold text-sm p-2 top-0 left-0 text-slate-500 sticky uppercase dark:bg-gray-800"
    >
      Blocks
    </div>
    {#if $slashItems.length}
      {#each $slashItems as { title, subtitle, command, icon }, i (title)}
        <div
          class="p-3 cursor-pointer {i == selectedIndex
            ? 'bg-gray-200 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800'}"
          transition:slide|local={{ duration: 200, easing: expoOut }}
          on:mouseenter={() => (selectedIndex = i)}
          on:click={() => {
            $slashVisible = false
            command($slashProps)
          }}
          bind:this={elements[i]}
        >
          <div class="flex space-x-2 items-center">
            {#if icon}
              <svelte:component this={icon} />
            {/if}
            <div class="flex flex-col">
              <div class="font-bold text-sm">{title}</div>
              <div class="text-xs text-slate-500">
                {subtitle ? subtitle : ''}
              </div>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="w-full p-3">
        <div class="font-bold text-center text-slate-500">Nothing found</div>
      </div>
    {/if}
  </div>
{/if}
