<script>
  import { flip } from 'svelte/animate'
  import { fly } from 'svelte/transition'
  import { notifications } from './notifications'
</script>

<div class="notifications">
  {#each $notifications as notification (notification.id)}
    <div
      animate:flip
      class="toast bg-white border rounded border-gray-200 mb-10px p-1 text-gray-700 z-20 z-999 flex dark:bg-gray-800 dark:border-gray-700 dark:text-white pointer-events-none"
      in:fly={{ y: 30 }}
      out:fly={{ y: -30 }}
    >
      <div class="content">{notification.message}</div>
      {#if notification.icon}<i class={notification.icon} />{/if}
    </div>
  {/each}
</div>

<style>
  .notifications {
    position: fixed;
    bottom: 10px;
    right: 10px;
    margin: 0 auto;
    padding: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-end;
    pointer-events: none;
  }

  .toast {
    flex: 0 0 auto;
  }
</style>
