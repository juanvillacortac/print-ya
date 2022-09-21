<script lang="ts">
  import { page } from '$app/stores'
  import { squareratio } from '$lib/actions/aspectratio'
  import { layoutData } from '$lib/stores'
  import trpc from '$lib/trpc/client'
  import { CheckmarkFilled32 } from 'carbon-icons-svelte'
  import { onMount } from 'svelte'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { fly, scale, slide } from 'svelte/transition'

  let error: Error | undefined
  let loading = false
  let form = ''
  let repwd = ''
  let el: HTMLInputElement

  $: token = $page.url.searchParams.get('token')
  let done = false

  onMount(() => {
    el.focus()
  })
  async function handleSubmit() {
    loading = true
    error = undefined
    try {
      if (token) {
        if (form !== repwd) {
          throw new Error('The passwords must be equals', {
            cause: 'INEQUALSPWD',
          })
        }
        await trpc().mutation('customer:recoverPassword', {
          newPassword: form,
          token,
          storeId: $layoutData.store?.id || '',
        })
      } else {
        await trpc().mutation('customer:issuePasswordRecoveryToken', {
          email: form,
          storeId: $layoutData.store?.id || '',
        })
      }
      done = true
    } catch (err) {
      error = err
    } finally {
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
    <p>Password recovery</p>
  </div>
  <div class="flex flex-col items-center">
    {#if done}
      <div class="flex flex-col space-y-4 items-center justify-center">
        <div
          class="mx-auto w-4/10 aspect-square"
          use:squareratio
          in:scale={{
            easing: elasticOut,
            start: 0,
            duration: 800,
            opacity: 1,
          }}
        >
          <CheckmarkFilled32 class="h-full w-full text-green-500" />
        </div>
        <div
          class="mx-auto text-center text-gray-500"
          in:fly={{
            delay: 200,
            duration: 400,
            y: 5,
          }}
        >
          {#if token}
            Password changed successfully
          {:else}
            We have just sent an email where you can change your password
          {/if}
        </div>
        {#if token}
          <a
            in:fly={{
              delay: 400,
              duration: 400,
              y: 5,
            }}
            class="text-center text-blue-500 inline hover:underline"
            href="/login">Log in to your account</a
          >
        {/if}
      </div>
    {:else}
      <form
        on:submit|preventDefault|stopPropagation={handleSubmit}
        class="flex flex-col space-y-2 w-full transition-opacity duration-400 lg:w-5/10"
      >
        <h3 class="font-bold font-title text-lg mb-2">Password Lost</h3>
        {#if error}
          <p
            transition:slide|local={{ duration: 400, easing: expoOut }}
            class="text-xs pb-2 text-red-500"
          >
            <span class="font-bold">Error:</span>
            {error.message}
          </p>
        {/if}
        {#if !token}
          <div class="flex space-x-2 items-center">
            <label class="flex flex-col space-y-2 w-full">
              <span class="font-bold text-xs">Enter your email</span>
              <input
                class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                type="email"
                autocomplete="off"
                placeholder="example@domain.com"
                required
                bind:this={el}
                bind:value={form}
              />
            </label>
          </div>
        {:else}
          <div class="flex flex-col space-y-2 w-full pb-2 items-center">
            <label class="flex flex-col space-y-2 w-full">
              <span class="font-bold text-xs">Password</span>
              <input
                class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                type="password"
                autocomplete="off"
                placeholder="Password"
                required
                bind:this={el}
                bind:value={form}
              />
            </label>
            <label class="flex flex-col space-y-2 w-full">
              <span class="font-bold text-xs">Repeat the password</span>
              <input
                class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
                type="password"
                autocomplete="off"
                placeholder="Repeat the password"
                required
                bind:value={repwd}
              />
            </label>
          </div>
        {/if}
        <button
          class="bg-$sc-color-primary rounded flex font-bold mr-auto text-sm py-2 px-6 transform-gpu duration-200 !text-white hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
          disabled={loading}
          type="submit"
          >{loading
            ? 'Loading...'
            : token
            ? 'Change the password'
            : 'Check email'}</button
        >
        <div class="flex space-x-2 text-sm pt-2 items-center">
          <a
            href="/login"
            class="font-bold text-$sc-color-primary dark:text-white hover:underline"
            >Log in</a
          >
        </div>
      </form>
    {/if}
  </div>
</div>
