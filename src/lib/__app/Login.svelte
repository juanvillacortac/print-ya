<script lang="ts">
  import { page } from '$app/stores'
  import { notifications } from '$lib/components/notifications'
  import trpc from '$lib/trpc/client'
  import { onMount } from 'svelte'

  let loading = false
  let isLogin = true
  let emailEl: HTMLInputElement
  let email: string, password: string, rePassword: string

  onMount(() => {
    emailEl.focus()
  })
  async function handleSubmit() {
    loading = true
    if (!isLogin) {
      if (password !== rePassword) {
        notifications.send('Passwords must be the same', 'default', 1000)
        return
      }
    }
    try {
      const data = await trpc().mutation(
        isLogin ? 'user:login' : 'user:register',
        {
          email: email?.toLocaleLowerCase(),
          password,
        }
      )
      notifications.send('Log in successfull', 'default', 1000)
      const callbackUrl = decodeURIComponent(
        $page.url.searchParams.get('callbackUrl') || encodeURIComponent('/')
      )
      window.location.replace(callbackUrl)
    } catch ({ message }) {
      notifications.send(message, 'default', 1000)
      loading = false
    }
  }
</script>

<div class="flex h-screen text-center w-full p-4 items-center justify-center">
  <div class="flex flex-col items-center">
    <svg
      id="logo-35"
      width="50"
      height="39"
      class="mb-6"
      viewBox="0 0 50 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
        class="ccompli1"
        fill="#007AFF"
      />
      <path
        d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
        class="ccustom"
        fill="#312ECB"
      />
    </svg>
    <!-- <h1
      class="font-logo font-bold text-transparent p-4 text-8xl rainbow-bg !bg-clip-text"
    >
      ShackCart
    </h1> -->
    <form
      on:submit|preventDefault|stopPropagation={handleSubmit}
      class="flex flex-col space-y-4 transition-opacity duration-400"
    >
      <button
        class="text-blue-500 self-end inline hover:underline"
        on:click={() => (isLogin = !isLogin)}
        type="reset">{isLogin ? 'Register' : 'Log in'}</button
      >
      <input
        class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
        type="email"
        autocomplete="off"
        placeholder="Email address"
        required
        bind:value={email}
        bind:this={emailEl}
      />
      <input
        class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
        type="password"
        autocomplete="off"
        placeholder="Password"
        required
        bind:value={password}
      />
      {#if !isLogin}
        <input
          class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          type="password"
          autocomplete="off"
          placeholder="Repeat the password"
          required
          bind:value={rePassword}
        />
      {/if}
      <button
        class="rounded-lg font-bold border-2 border-blue-500 text-sm py-2 px-2 transform-gpu text-blue-500 duration-200 hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
        disabled={loading}
        type="submit"
        >{loading ? 'Loading...' : isLogin ? 'Log in' : 'Register'}</button
      >
    </form>
  </div>
</div>
