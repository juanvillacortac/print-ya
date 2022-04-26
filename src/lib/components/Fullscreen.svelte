<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import type ScreenFull from 'screenfull'

  let screenfull: typeof ScreenFull

  let component: HTMLElement
  const dispatch = createEventDispatcher<{ change: never; error: never }>()

  onMount(async () => {
    screenfull = await import('screenfull').then((m) => m.default)
    if (screenfull?.isEnabled) {
      screenfull.on('change', () => dispatch('change'))
      screenfull.on('error', () => dispatch('error'))
    }
  })

  const onToggle = () => {
    if (screenfull?.isEnabled && component?.nextElementSibling) {
      screenfull.toggle(component.nextElementSibling)
    }
  }

  const onRequest = () => {
    if (screenfull?.isEnabled && component?.nextElementSibling) {
      screenfull.request(component.nextElementSibling)
    }
  }

  const onExit = () => {
    if (screenfull?.isEnabled && component?.nextElementSibling) {
      screenfull.exit()
    }
  }

  onDestroy(() => {
    if (screenfull?.isEnabled) {
      screenfull.off('change', () => true)
      screenfull.off('error', () => true)
    }
  })
</script>

<div style="width:0; height:0" bind:this={component} />
<slot {onToggle} {onRequest} {onExit} />
