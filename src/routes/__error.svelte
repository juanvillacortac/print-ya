<script context="module">
  /** @type {import('@sveltejs/kit').Load} */
  export function load({ error, status }) {
    return {
      props: {
        ...error,
        status, // same as status: status
      },
    }
  }
</script>

<script>
  export let message
  export let stack
  export let status
</script>

<div class="font-bold text-6xl">
  {status}
</div>

<p class="my-4">{message}</p>

{#if stack}
  <pre>{stack}</pre>
{/if}
