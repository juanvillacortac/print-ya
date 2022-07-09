<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, session }) => {
    if (session.userId) {
      const user = await trpc(fetch).query('user:whoami')
      if (user) {
        return {
          status: 302,
          redirect: '/',
        }
      } else {
        await trpc(fetch).mutation('user:logout')
      }
    }
    return {}
  }
</script>

<script lang="ts">
  import { page, session } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import { notifications } from '$lib/components/notifications'
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

  $: $pageSubtitle = isLogin ? 'Log in' : 'Register'
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full p-4 justify-center lg:w-9/10"
>
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>{isLogin ? 'Log In' : 'Sign up'}</p>
  </div>
  <div class="flex flex-col items-center">
    <form
      on:submit|preventDefault|stopPropagation={handleSubmit}
      class="flex flex-col space-y-4 w-full transition-opacity duration-400 lg:w-5/10"
    >
      <h3 class="font-bold font-title text-lg">Account Login</h3>
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
        class="flex font-bold mr-auto bg-red-900 text-sm py-2 px-6 transform-gpu duration-200 !text-white hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
        disabled={loading}
        type="submit"
        >{loading ? 'Loading...' : isLogin ? 'Log in' : 'Register'}</button
      >
    </form>
  </div>
</div>

<style>
  .rainbow-bg {
    background: linear-gradient(
      90deg,
      rgba(255, 0, 0, 1) 0%,
      rgba(255, 154, 0, 1) 10%,
      rgba(208, 222, 33, 1) 20%,
      rgba(79, 220, 74, 1) 30%,
      rgba(63, 218, 216, 1) 40%,
      rgba(47, 201, 226, 1) 50%,
      rgba(28, 127, 238, 1) 60%,
      rgba(95, 21, 242, 1) 70%,
      rgba(186, 12, 248, 1) 80%,
      rgba(251, 7, 217, 1) 90%,
      rgba(255, 0, 0, 1) 100%
    );
  }
</style>
