<script lang="ts">
  import { page } from '$app/stores'
  import { notifications } from '$lib/components/notifications'
  import { layoutData } from '$lib/stores'
  import trpc from '$lib/trpc/client'
  import { api } from '@shackcart/shared'
  import { onMount } from 'svelte'
  import { expoOut } from 'svelte/easing'
  import { derived } from 'svelte/store'
  import { slide } from 'svelte/transition'

  let loading = false
  const isLogin = derived(
    [page],
    ([page]) => page.url.searchParams.get('register') === null
  )
  let emailEl: HTMLInputElement
  let email: string,
    password: string,
    rePassword: string,
    firstName: string,
    lastName: string,
    phone: string

  onMount(() => {
    emailEl.focus()
  })

  let error: string | undefined

  const resetLogin = (...deps: any[]) => (error = '')

  $: resetLogin(isLogin)

  async function handleSubmit() {
    loading = true
    if (!isLogin) {
      if (password !== rePassword) {
        notifications.send('Passwords must be the same', 'default', 1000)
        return
      }
    }
    try {
      if ($isLogin) {
        // await api.post('/api/auth/login', {
        //   email: email?.toLocaleLowerCase(),
        //   password,
        //   layoutData: $layoutData,
        // })
        await trpc().mutation('customer:login', {
          email: email?.toLocaleLowerCase(),
          password,
          storeId: $layoutData.store?.id!,
        })
      } else {
        await trpc().mutation('customer:register', {
          email: email?.toLocaleLowerCase(),
          firstName,
          lastName,
          password,
          phone,
          storeId: $layoutData.store?.id!,
        })
      }
      const callbackUrl = decodeURI(
        $page.url.searchParams.get('callbackUrl') || encodeURI('/')
      )
      window.location.replace(callbackUrl)
    } catch ({ message }) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      error = message
      loading = false
    }
  }
</script>

<div
  class="flex flex-col mx-auto space-y-4 w-full p-4 justify-center lg:w-9/10"
>
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <p>{$isLogin ? 'Log In' : 'Sign up'}</p>
  </div>
  <div class="flex flex-col items-center">
    <form
      on:submit|preventDefault|stopPropagation={handleSubmit}
      class="flex flex-col space-y-2 w-full transition-opacity duration-400 lg:w-5/10"
    >
      <h3 class="font-bold font-title text-lg mb-2">
        {$isLogin ? 'Log In Account' : 'Create Account'}
      </h3>
      {#if error}
        <p
          transition:slide|local={{ duration: 400, easing: expoOut }}
          class="text-xs pb-2 text-red-500"
        >
          <span class="font-bold">Error:</span>
          {error}
        </p>
      {/if}
      {#if !$isLogin}
        <div class="flex space-x-2 items-center">
          <label class="flex flex-col space-y-2 w-1/2">
            <span class="font-bold text-xs">First name</span>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              autocomplete="off"
              placeholder="First name"
              required
              bind:value={firstName}
            />
          </label>
          <label class="flex flex-col space-y-2 w-1/2">
            <span class="font-bold text-xs">Last name</span>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="text"
              autocomplete="off"
              placeholder="Last name"
              required
              bind:value={lastName}
            />
          </label>
        </div>
      {/if}
      <div class="flex space-x-2 w-full pb-2 items-center">
        <label
          class="flex flex-col space-y-2 w-full"
          class:!w-[50%]={!$isLogin}
        >
          <span class="font-bold text-xs">Email address</span>
          <input
            class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="email"
            autocomplete="off"
            placeholder="Ex. example@domain.com"
            required
            bind:value={email}
            bind:this={emailEl}
          />
        </label>
        {#if !$isLogin}
          <label class="flex flex-col space-y-2 w-1/2">
            <span class="font-bold text-xs">Phone number</span>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="tel"
              autocomplete="off"
              placeholder="+1 23456789"
              required
              bind:value={phone}
            />
          </label>
        {/if}
      </div>
      <div class="flex space-x-2 w-full pb-2 items-center">
        <label
          class="flex flex-col space-y-2 w-full"
          class:!w-[50%]={!$isLogin}
        >
          <span class="font-bold text-xs">Password</span>
          <input
            class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="password"
            autocomplete="off"
            placeholder="Password"
            required
            bind:value={password}
          />
        </label>
        {#if !$isLogin}
          <label class="flex flex-col space-y-2 w-1/2">
            <span class="font-bold text-xs">Repeat the password</span>
            <input
              class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
              type="password"
              autocomplete="off"
              placeholder="Repeat the password"
              required
              bind:value={rePassword}
            />
          </label>
        {/if}
      </div>
      <button
        class="bg-$sc-color-primary rounded flex font-bold mr-auto text-sm py-2 px-6 transform-gpu duration-200 !text-white hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
        disabled={loading}
        type="submit"
        >{loading ? 'Loading...' : $isLogin ? 'Log in' : 'Register'}</button
      >
      <div class="flex space-x-2 text-sm pt-2 items-center">
        {#if $isLogin}
          <span>Don't have an account yet?</span>
          <a
            href="?register"
            class="font-bold text-$sc-color-primary dark:text-red-500 hover:underline"
            >Create account</a
          >
        {:else}
          <span>Do you have an account?</span>
          <a
            href="/login"
            class="font-bold text-$sc-color-primary dark:text-red-500 hover:underline"
            >Log in</a
          >
        {/if}
      </div>
    </form>
  </div>
</div>
