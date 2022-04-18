<script>
  import { preferences } from '$lib/stores'

  import { fly } from 'svelte/transition'
  import elements from './links'
  export let open = true

  let inside
  let menu

  $: if (!open) menu = null

  function handleClick() {
    if (!inside && open) {
      //open = false
    }
  }
</script>

<svelte:window on:click={handleClick} />

{#if open}
  <aside
    on:mouseenter={() => (inside = true)}
    on:mouseleave={() => (inside = false)}
    class="font-bold font-title h-screen shadow w-screen absolute"
    class:open
    transition:fly={{ x: 100, duration: 500 }}
  >
    <div class="flex flex-col h-full px-6 pt-32 text-4xl">
      {#if !menu}
        <div>
          {#each elements as el, i}
            {#if el.childrens}
              <div
                class="cursor-pointer flex my-4 w-full py-1 justify-between nav-link"
                on:click={() => (menu = el)}
                in:fly={{
                  x: 100,
                  duration: 500,
                  delay: 100 + (i * 500) / elements.length,
                }}
              >
                <p
                  class="cursor-pointer font-light text-lg self-end hidden alt-title lg:block"
                >
                  {el.alt}
                </p>
                <p class="cursor-pointer flex items-center">
                  <span class="cursor-pointer">{el.titulo}</span>
                </p>
              </div>
            {:else}
              <a
                class="flex my-4 w-full py-1 justify-between nav-link"
                href={el.href}
                in:fly={{
                  x: 100,
                  duration: 500,
                  delay: 100 + (i * 500) / elements.length,
                }}
              >
                <p
                  class="cursor-pointer font-light text-lg self-end hidden alt-title lg:block"
                >
                  {el.alt}
                </p>
                <p class="cursor-pointer">{el.titulo}</p>
              </a>
            {/if}
          {/each}
        </div>
        <div class="flex flex-col lg:flex-col-reverse lg:items-end">
          <div
            class="-m-4 py-6 pt-8 buttons"
            in:fly={{
              x: 100,
              duration: 500,
              delay: 100 + (elements.length * 500) / elements.length,
            }}
          >
            <button
              title="Change theme"
              on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
              class="focus:outline-none mx-4 uppercase cursor-pointer i jam:{$preferences.darkMode
                ? 'sun'
                : 'moon'}"
            />
          </div>
          <div
            class="flex my-4 text-base"
            in:fly={{
              x: 100,
              duration: 500,
              delay: 100 + ((elements.length + 1) * 500) / elements.length,
            }}
          >
            <a
              class="mx-2 btn-secondary-gray dark:text-yes-gray-200"
              href="https://yescampus.teachlr.com/#signin">Iniciar sesión</a
            >
            <a
              class="mx-2 btn-primary-gray"
              href="https://yescampus.teachlr.com/#register">Regístrate</a
            >
          </div>
        </div>
      {:else}
        <button
          class="cursor-pointer flex font-bold mr-auto my-1 text-xl ml-0 nav-link lg:ml-auto lg:mr-0 lg:text-right"
          in:fly={{ x: -100, duration: 500 }}
          on:click={() => (menu = null)}
          ><span class="cursor-pointer mr-2 i jam:chevron-left" /><span
            class="cursor-pointer">Atrás</span
          ></button
        >
        <p
          class="my-2 w-full py-1 block lg:text-right"
          in:fly={{ x: -100, duration: 500 }}
        >
          {menu.titulo}
        </p>
        <div class="mb-6 overflow-x-hidden overflow-y-auto">
          {#each menu.childrens as el, i}
            <a
              class="my-2 text-xl w-full py-1 block nav-link lg:text-right"
              href={el.href}
              in:fly={{
                x: -100,
                duration: 500,
                delay: 100 + (i * 500) / menu.childrens.length,
              }}>{el.titulo}</a
            >
          {/each}
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style windi:global>
  aside {
    transition: background-color 0.2s ease-in-out;
    background-color: rgba(255, 255, 255, 1);
  }

  .buttons {
    display: flex;
    @apply text-4xl;
  }

  :global(.dark aside) {
    background-color: rgba(10, 10, 10, 1);
  }

  .nav-link {
    --border: 2px solid #3a3939;
    --alt-opacity: 0;
    border-bottom: 2px solid transparent;
    @apply duration-200;
  }

  :global(.dark .selected-nav) {
    --border: 2px solid #d7d7d7;
  }

  .alt-title {
    opacity: var(--alt-opacity);
    @apply duration-200;
  }

  .nav-link:hover {
    --alt-opacity: 1;
    border-bottom: var(--border);
  }
</style>
