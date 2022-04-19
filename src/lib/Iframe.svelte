<script lang="ts">
  import { onMount } from 'svelte'
  import srcdoc from './srcdoc'

  let container: HTMLElement = null
  let isReady = false
  export let props = {
    dark: false,
    css: '',
    fixedCss: '',
    classes: '',
    html: '',
  }

  let sandbox: HTMLIFrameElement

  onMount(createSandBox)

  function createSandBox() {
    if (sandbox) container?.removeChild(sandbox)

    sandbox = document.createElement('iframe')
    sandbox.setAttribute(
      'sandbox',
      [
        'allow-forms',
        'allow-modals',
        'allow-pointer-lock',
        'allow-popups',
        'allow-same-origin',
        'allow-scripts',
        'allow-top-navigation-by-user-activation',
      ].join(' ')
    )
    sandbox.srcdoc = srcdoc
    sandbox.style.backgroundColor = 'transparent'
    container.appendChild(sandbox)
    sandbox.addEventListener('load', () => {
      isReady = true
    })
  }

  $: {
    for (const key of Object.keys(props) as (keyof typeof props)[]) {
      if (isReady) {
        sandbox?.contentWindow?.postMessage(
          JSON.stringify({
            [key]: props[key],
          }),
          location.origin
        )
      }
    }
  }

  $: {
    if (isReady) {
      sandbox.contentWindow?.document
        ?.querySelector('html')
        ?.classList?.toggle('dark', props.dark)
    }
  }
</script>

<div bind:this={container} class="flex h-full w-full" />

<style>
  div > :global(iframe) {
    width: 100%;
    height: 100%;
  }
</style>
