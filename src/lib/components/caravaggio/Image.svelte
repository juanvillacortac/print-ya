<script lang="ts">
  import type { CaravaggioOptions } from './urlBuilder'
  import { useCaravaggio } from './useCaravaggio'

  export let src: string
  export let href = ''
  export let options: CaravaggioOptions
  export let showOriginal: string = ''

  $: url =
    src?.endsWith(showOriginal) && showOriginal
      ? src
      : useCaravaggio(src, options)
</script>

{#if href}
  <a {href} target="__blank">
    <img src={url} alt={$$props.alt} {...$$restProps} />
  </a>
{:else}
  <img src={url} alt={$$props.alt} {...$$restProps} />
{/if}
