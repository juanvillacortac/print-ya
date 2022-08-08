<script lang="ts">
  import { fade } from 'svelte/transition'
  import mediumZoom from 'medium-zoom'

  import type { CaravaggioOptions } from './urlBuilder'
  import { useCaravaggioBuilder } from './useCaravaggio'

  export let src: string
  export let href = ''
  export let options: CaravaggioOptions
  export let showOriginal: string = ''
  export let lazy = false
  export let zoom = false

  export let loaded = false

  const imageBuilder = useCaravaggioBuilder()

  $: url =
    src?.endsWith(showOriginal) && showOriginal
      ? src
      : imageBuilder(src, options)

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new window.Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  const load = (node: HTMLImageElement) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadImage(url).then(() => {
          loaded = true
          if (zoom) {
            mediumZoom(node, {})
          }
        })
        return
      }
    })
    observer.observe(node)
    return {
      destroy: () => {
        observer.unobserve(node)
      },
    }
  }
</script>

{#if lazy}
  {#if href}
    <a {href} target="__blank">
      <!-- svelte-ignore a11y-missing-attribute -->
      <div class="relative">
        {#if !loaded}
          <div
            class="flex h-full w-full top-0 absolute"
            out:fade={{ duration: 200 }}
          >
            <div class="h-full w-full skeleton" />
          </div>
        {/if}
        <!-- svelte-ignore a11y-missing-attribute -->
        <img use:load src={url} {...$$restProps} class:opacity-0={!loaded} />
      </div>
    </a>
  {:else}
    <div class="relative">
      {#if !loaded}
        <div
          class="flex h-full w-full top-0 absolute"
          out:fade={{ duration: 200 }}
        >
          <div class="h-full w-full skeleton" />
        </div>
      {/if}
      <!-- svelte-ignore a11y-missing-attribute -->
      <img use:load src={url} {...$$restProps} class:opacity-0={!loaded} />
    </div>
  {/if}
{:else if href}
  <a {href} target="__blank">
    <!-- svelte-ignore a11y-missing-attribute -->
    <img src={url} {...$$restProps} class:opacity-0={!loaded} />
  </a>
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <img use:load src={url} {...$$restProps} class:opacity-0={!loaded} />
{/if}
