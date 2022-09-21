<script lang="ts">
  import { page } from '$app/stores'
  import { squareratio } from '$lib/actions/aspectratio'
  import { notifications } from '$lib/components/notifications'
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
        await trpc().mutation('user:recoverPassword', {
          newPassword: form,
          token,
        })
      } else {
        await trpc().mutation('user:issuePasswordRecoveryToken', {
          email: form,
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

<div class="flex h-screen text-center w-full p-4 items-center justify-center">
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
      <form
        on:submit|preventDefault|stopPropagation={handleSubmit}
        class="flex flex-col space-y-4 transition-opacity duration-400"
      >
        <a class="text-blue-500 self-end inline hover:underline" href="/login"
          >Log in</a
        >
        {#if error}
          <p
            transition:slide={{ duration: 400, easing: expoOut }}
            class="text-xs text-left w-full text-red-500"
          >
            {error.message}
          </p>
        {/if}
        {#if !token}
          <input
            class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="email"
            autocomplete="off"
            placeholder="Email address"
            required
            bind:value={form}
            bind:this={el}
          />
        {:else}
          <input
            class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="password"
            autocomplete="off"
            placeholder="Password"
            bind:value={form}
            bind:this={el}
            required
          />
          <input
            class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            class:!border-red-500={error?.cause === 'INEQUALSPWD'}
            class:!bg-red-700={error?.cause === 'INEQUALSPWD'}
            class:!bg-opacity-50={error?.cause === 'INEQUALSPWD'}
            type="password"
            autocomplete="off"
            placeholder="Repeat the password"
            bind:value={repwd}
            required
          />
        {/if}
        <button
          class="rounded-lg font-bold border-2 border-blue-500 text-sm py-2 px-2 transform-gpu text-blue-500 duration-200 hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
          disabled={loading}
          type="submit"
          >{loading
            ? 'Loading...'
            : token
            ? 'Change the password'
            : 'Check email'}</button
        >
      </form>
    </div>
  {/if}
</div>
