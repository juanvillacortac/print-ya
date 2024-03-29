<script lang="ts">
  import 'bytemd/dist/index.css'
  import { goto } from '$app/navigation'

  import { redisWritable, layoutData } from '$lib'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'
  import { tooltip } from '$lib/components/tooltip'
  import { Close24, Image32 } from 'carbon-icons-svelte'
  import { expoOut } from 'svelte/easing'
  import { fade, scale } from 'svelte/transition'
  import StripeLogo from '$lib/components/__StripeLogo.svelte'
  import PaypalLogo from '$lib/components/__PaypalLogo.svelte'
  import trpc, { invalidateQuery } from '$lib/trpc/client'
  import { supabase } from '@shackcart/shared'

  let store = { ...$layoutData.store! }
  const contactEmailTemplate = redisWritable(
    `**You've got a new message from {{name}}, their email is [{{email}}](mailto:{{email}}) and their phone number is [{{phone}}](tel:{{phone}})**

### Message:

{{message}}`,
    `contactEmailTemplate:${store.id}`
  )

  const faqContent = redisWritable('', `storeFaq:${store.id}`)

  let email = (store.contactData as any)?.email || ''
  let phone = (store.contactData as any)?.phone || ''
  let credentials = {
    paypal: {
      clientId: '',
    },
    stripe: {
      privateKey: '',
      publicKey: '',
    },
  }

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'embed',
      b: '000000.0',
    },
  }

  let saving = false
  let uploadingLogo = false
  let uploadingFavicon = false

  const submit = async () => {
    saving = true
    try {
      const data = await trpc().mutation('stores:upsert', store)

      if (data.slug !== $layoutData.store?.slug) {
        goto(`/stores/${data.slug}/settings`)
      } else {
        await invalidateQuery('stores:getBySlug')
      }
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  const submitContact = async () => {
    saving = true
    try {
      const data = await trpc().mutation('stores:upsert', {
        id: store.id,
        slug: store.slug,
        contactData: {
          email,
          phone,
        },
      })

      if (data.slug !== $layoutData.store?.slug) {
        goto(`/stores/${data.slug}/settings`)
      } else {
        await invalidateQuery('stores:getBySlug')
      }
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new window.Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  const urlBuilder = useCaravaggioBuilder()

  const uploadImage = async ({ file }: { file: File }) => {
    const { url } = await supabase.uploadFile({
      file,
      bucket: 'assets',
      path: `${store.slug}`,
    })
    const optimizedUrl = urlBuilder(url || '', options)

    const _ = await loadImage(optimizedUrl)

    return url
  }

  const uploadLogo = async (event) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      const file = event.currentTarget.files[0]
      uploadingLogo = true
      const url = await uploadImage({ file })

      store.logo = url
    } catch (error) {
      alert(error.message)
    } finally {
      uploadingLogo = false
    }
  }

  const uploadFavicon = async (event) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      const file = event.currentTarget.files[0]
      uploadingFavicon = true
      const url = await uploadImage({ file })

      store.favicon = url
    } catch (error) {
      alert(error.message)
    } finally {
      uploadingFavicon = false
    }
  }
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Store settings
  </h3>
  <form
    on:submit|preventDefault={submit}
    class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
  >
    <div class="flex w-full justify-between items-">
      <h5 class="font-bold font-title text-sm">General settings</h5>
      <button
        class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
      >
    </div>
    <div
      class="flex w-full items-center sm:space-x-2 <sm:flex-col <sm:space-y-2"
    >
      <div class="flex flex-col w-full">
        <label class="font-bold text-xs mb-2 block" for="name">
          Store name
        </label>
        <input
          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          name="name"
          type="text"
          required
          bind:value={store.name}
        />
      </div>
      <div class="flex flex-col w-full">
        <label class="font-bold text-xs mb-2 block" for="slug">
          Store subdomain
        </label>
        <div class="flex">
          <input
            class="bg-white border rounded-tl rounded-bl border-gray-300 text-xs leading-tight w-full py-2 px-3 w-24 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            name="slug"
            type="text"
            required
            bind:value={store.slug}
          />
          <div
            class="border-t border-b border-r rounded-tr rounded-br font-bold bg-gray-100 border-gray-300 text-xs leading-tight w-full py-2 px-3 text-gray-500 appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 focus:outline-none focus:shadow-outline"
          >
            .shackcart.com
          </div>
        </div>
      </div>
    </div>
    <div class="flex w-full sm:space-x-2 <sm:flex-col <sm:space-y-2">
      <div class="flex-col flex space-y-2 w-full sm:w-1/2">
        <div class="font-bold text-xs">Custom domain</div>
        <input
          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          type="text"
          bind:value={store.customDomain}
        />
        <div
          class="border rounded flex flex-col font-bold space-y-2 bg-light-100 text-xs p-2 dark:bg-gray-700 dark:border-gray-600"
        >
          <p>
            For apex domains, set an
            <span
              class="rounded-sm font-mono font-normal bg-gray-200 px-2px dark:bg-gray-500"
              >A</span
            >
            record with
            <span
              class="rounded-sm font-mono font-normal bg-gray-200 px-2px dark:bg-gray-500"
              >76.76.21.21</span
            >
            as value
          </p>
          <p>
            For subdomains, set a
            <span
              class="rounded-sm font-mono font-normal bg-gray-200 px-2px dark:bg-gray-500"
              >CNAME</span
            >
            record with
            <span
              class="rounded-sm font-mono font-normal bg-gray-200 px-2px dark:bg-gray-500"
              >dns.shackcart.com</span
            >
            as value
          </p>
        </div>
      </div>
      <div class="w-full grid gap-4 grid-cols-2 sm:w-1/2">
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2">Store logo</div>
          <div class="relative">
            {#if store.logo}
              <button
                transition:scale|local={{
                  start: 0.2,
                  duration: 400,
                  easing: expoOut,
                }}
                type="button"
                class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-30 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
                title="Delete image"
                on:click={() => (store.logo = '')}
                use:tooltip
              >
                <Close24 />
              </button>
            {/if}
            <div
              class="border-dashed rounded-lg flex border-2 w-full overflow-hidden relative aspect-square dark:border-gray-700 "
              use:squareratio
            >
              {#if uploadingLogo}
                <div
                  class="flex h-full w-full opacity-30 top-0 absolute"
                  transition:fade|local={{ duration: 200 }}
                >
                  <div class="h-full w-full skeleton" />
                </div>
              {/if}
              {#if store.logo}
                <div
                  class="flex p-2"
                  transition:scale|local={{
                    start: 0.2,
                    duration: 400,
                    easing: expoOut,
                  }}
                >
                  <Image
                    {options}
                    src={store.logo}
                    class="rounded object-cover w-full aspect-square"
                  />
                </div>
              {:else}
                {#if !uploadingLogo}
                  <input
                    type="file"
                    name=""
                    class="cursor-pointer flex h-full w-full opacity-0 z-20 absolute"
                    accept="image/*"
                    on:change={uploadLogo}
                  />
                {/if}
                <div
                  class="flex flex-col h-full text-center w-full text-gray-400 items-center justify-center absolute"
                  transition:scale|local={{
                    start: 0.2,
                    duration: 400,
                    easing: expoOut,
                  }}
                >
                  <Image32 class="mb-1" />
                  <span class="font-normal text-xs block"
                    >{uploadingLogo
                      ? 'Uploading image...'
                      : 'Upload image'}</span
                  >
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2">Store favicon</div>
          <div class="relative">
            {#if store.favicon}
              <button
                transition:scale|local={{
                  start: 0.2,
                  duration: 400,
                  easing: expoOut,
                }}
                type="button"
                class="bg-white rounded-full shadow p-1 transform top-0 right-0 z-30 translate-x-[25%] translate-y-[-25%] absolute dark:bg-gray-700"
                title="Delete image"
                on:click={() => (store.favicon = '')}
                use:tooltip
              >
                <Close24 />
              </button>
            {/if}
            <div
              class="border-dashed rounded-lg flex border-2 w-full overflow-hidden relative aspect-square dark:border-gray-700 "
              use:squareratio
            >
              {#if uploadingFavicon}
                <div
                  class="flex h-full w-full opacity-30 top-0 absolute"
                  transition:fade|local={{ duration: 200 }}
                >
                  <div class="h-full w-full skeleton" />
                </div>
              {/if}
              {#if store.favicon}
                <div
                  class="flex p-2"
                  transition:scale|local={{
                    start: 0.2,
                    duration: 400,
                    easing: expoOut,
                  }}
                >
                  <Image
                    {options}
                    src={store.favicon}
                    class="rounded object-cover w-full aspect-square"
                  />
                </div>
              {:else}
                {#if !uploadingFavicon}
                  <input
                    type="file"
                    name=""
                    class="cursor-pointer flex h-full w-full opacity-0 z-20 absolute"
                    accept="image/*"
                    on:change={uploadFavicon}
                  />
                {/if}
                <div
                  class="flex flex-col h-full text-center w-full text-gray-400 items-center justify-center absolute"
                  transition:scale|local={{
                    start: 0.2,
                    duration: 400,
                    easing: expoOut,
                  }}
                >
                  <Image32 class="mb-1" />
                  <span class="font-normal text-xs block"
                    >{uploadingFavicon
                      ? 'Uploading image...'
                      : 'Upload image'}</span
                  >
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div
    class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
  >
    <div class="flex w-full justify-between items-">
      <h5 class="font-bold font-title text-sm">Contact information</h5>
      <button
        class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        on:click={submitContact}
        disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
      >
    </div>
    <div
      class="flex w-full items-center sm:space-x-2 <sm:flex-col <sm:space-y-2"
    >
      <div class="flex flex-col w-full">
        <label class="flex flex-col font-bold space-y-2 text-xs">
          <span>Email for contact</span>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="email"
            placeholder="Ex. contact@{store.slug}.com"
            bind:value={email}
          />
        </label>
      </div>
      <div class="flex flex-col w-full">
        <label class="flex flex-col font-bold space-y-2 text-xs">
          <span>Phone number</span>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="tel"
            placeholder="Ex. +1 XXXXXX"
            bind:value={phone}
          />
        </label>
      </div>
    </div>
    <div class="flex flex-col w-full">
      <div class="flex flex-col space-y-2 text-xs w-full">
        <span class="font-bold text-xs"> Contact form email template </span>
        <textarea
          required
          class="bg-white border rounded border-gray-300 h-24 text-sm leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          bind:value={$contactEmailTemplate}
        />
        <!-- {#if browser}
          <Editor
            value={$contactEmailTemplate}
            on:change={(e) => ($contactEmailTemplate = e.detail.value)}
          />
        {/if} -->
      </div>
    </div>
    <div class="flex flex-col w-full">
      <div class="flex flex-col space-y-2 text-xs w-full">
        <span class="font-bold text-xs"> FAQ content </span>
        <textarea
          required
          class="bg-white border rounded border-gray-300 h-24 text-sm leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          bind:value={$faqContent}
        />
        <!-- {#if browser}
          <Editor
            value={$faqContent}
            on:change={(e) => ($faqContent = e.detail.value)}
          />
        {/if} -->
      </div>
    </div>
  </div>

  <form
    class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-gray-800 dark:border-gray-600"
    on:submit|preventDefault={async () => {
      saving = true
      try {
        const data = await trpc().mutation(
          'stores:payment:setGatewaysCredentials',
          {
            ...credentials,
            storeId: $layoutData.store?.id || '',
          }
        )

        if (data.ok) {
          credentials = {
            paypal: {
              clientId: '',
            },
            stripe: {
              privateKey: '',
              publicKey: '',
            },
          }
        }
      } catch (err) {
        console.log(err.message, err.error)
      } finally {
        saving = false
      }
    }}
  >
    <h5 class="font-bold font-title text-sm">Payment gateways</h5>
    <div
      class="border rounded-lg flex flex-col space-y-2 border-gray-300 w-full p-4 items-start dark:border-gray-600"
    >
      <div class="flex w-full justify-between">
        <StripeLogo class="h-6 w-auto" />
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Applying...' : 'Apply'}</button
        >
      </div>
      <div class="w-full grid gap-2 grid-cols-2">
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2 block">Public key</div>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="text"
            style="text-security:disc; -webkit-text-security:disc;"
            bind:value={credentials.stripe.publicKey}
          />
        </div>
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2 block">Secret key</div>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
            type="text"
            style="text-security:disc; -webkit-text-security:disc;"
            bind:value={credentials.stripe.privateKey}
          />
        </div>
      </div>
    </div>
    <div
      class="border rounded-lg flex flex-col space-y-2 border-gray-300 w-full p-4 items-start dark:border-gray-600"
    >
      <div class="flex w-full justify-between">
        <PaypalLogo class="h-6 w-auto" />
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Applying...' : 'Apply'}</button
        >
      </div>
      <div class="flex flex-col w-full">
        <div class="font-bold text-xs mb-2 block">Client ID</div>
        <input
          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:shadow-outline"
          type="text"
          style="text-security:disc; -webkit-text-security:disc;"
          bind:value={credentials.paypal.clientId}
        />
      </div>
    </div>
  </form>
</div>
