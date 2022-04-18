<script>
  export let titulo

  export let links
</script>

<div class="relative cursor-pointer dropdown">
  <div>
    <button class="flex items-center py-4 mx-4 focus:outline-none">
      <span>{titulo}</span><span
        class="ml-2 i jam:chevron-down transform duration-200 arrow"
      />
    </button>

    <div
      style="min-width: 13rem"
      class="absolute right-0 flex flex-col py-2 -mt-2 bg-white border shadow-md dropdown-wrapper transform duration-200 rounded-xl origin-top-right dark:bg-yes-gray-800 dark:border-yes-gray-900"
    >
      {#each links as l}
        <a href={l.href} class="block py-1 mx-4 my-1 nav-link">{l.titulo}</a>
      {/each}
    </div>
  </div>
</div>

<style windi:global>
  .dropdown button span {
    pointer-events: none;
  }
  .dropdown .dropdown-wrapper {
    opacity: 0;
    transform: scale(0.9, 0.9);
    pointer-events: none;
  }

  .dropdown:hover .arrow {
    @apply rotate-180;
  }

  .dropdown:hover .dropdown-wrapper {
    opacity: 1;
    transform: scale(1, 1);
    pointer-events: auto;
  }

  .nav-link {
    transition: border 0.2s ease-in-out, color 0s ease-in-out;
    border-bottom: 2px solid transparent;
  }

  .nav-link:hover {
    border-bottom: 2px solid #0273e3;
  }
</style>
