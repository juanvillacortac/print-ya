<script context="module">
  /** @type {import('@sveltejs/kit').Load} */
  export function load({ error, status }) {
    console.log(error)
    return {
      props: {
        error,
        status, // same as status: status
      },
    }
  }
</script>

<script>
  export let error
  export let status
</script>

<div class="font-bold text-6xl">
  {status}
</div>

<p class="my-4">{error.name}</p>

<p class="my-4">{error.message}</p>

{#if error.stack}
  <pre>{error.stack}</pre>
{/if}
