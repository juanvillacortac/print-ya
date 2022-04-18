<script context="module">
  import { writable } from 'svelte/store'
  import { spring } from 'svelte/motion'

  export const coords = spring(
    { x: 0, y: 0 },
    {
      stiffness: 0.12,
      damping: 1,
    }
  )

  export const origSize = 25
  export const origSize2 = origSize / 4
  export const size = spring(origSize, {
    stiffness: 0.12,
    damping: 1,
  })
  export const size2 = spring(origSize2, {
    stiffness: 0.12,
    damping: 1,
  })

  const hoveringInitial = {
    status: false,
    primary: false,
    sticky: false,
    node: null,
    mul: 4,
    text: null,
    color: null,
  }

  const hovering = writable(hoveringInitial)

  const expand = (mul = 4) => {
    size.set(origSize * mul)
  }

  const trigger = (options = { primary: false, mul: 4 }) => {
    expand(options.mul)
    if (options.primary) {
      size2.set(0, { hard: true })
    } else {
      size2.set(origSize2 * options.mul)
    }
  }

  const normalize = () => {
    expand(1)
    size2.set(origSize2)
  }

  const mouseEnter = (node, options) => () => {
    trigger(options)
    hovering.set({ status: true, ...options, node })
  }

  const mouseLeave = () => {
    normalize()
    hovering.set(hoveringInitial)
  }

  export const hoverable = (
    node,
    options = { primary: false, mul: 4, sticky: false, }
  ) => {
    node.addEventListener('mouseenter', mouseEnter(node, options))
    node.addEventListener('mouseleave', mouseLeave)
  }
</script>

<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { styles } from '$lib'
  let coordsAbs = {
    x: 50,
    y: 50,
  }
  let hidden = true

  const mouseMove = (e) => {
    if (touches) {
      return
    }
    let hard = hidden
    hidden = false
    let x
    let y
    if ($hovering.status && $hovering.sticky) {
      const rect = $hovering.node.getBoundingClientRect()
      x = rect.left + $hovering.node.clientWidth / 2
      y = rect.top + $hovering.node.clientHeight / 2
    } else {
      x = e.clientX
      y = e.clientY
    }
    coords.set({ x, y }, { hard })
    coordsAbs = { x, y }
  }

  const mouseDown = () => {
    touches = null
    let mul = 2
    if ($hovering.text) {
      mul = 3
    }
    trigger({ primary: $hovering.primary, mul })
  }

  const mouseUp = (e) => {
    if ($hovering.status) {
      if ($hovering.primary) {
        trigger({ primary: true, mul: $hovering.mul })
      } else {
        trigger()
      }
    } else {
      normalize()
    }
  }

  let touches

  onMount(() => {
    window.addEventListener('touchstart', (e) => {
      hidden = true
      touches = e.touches
    })
    window.addEventListener('touchend', (e) => {
      hidden = true
    })
  })

  function hexToRGB(h, a) {
    let r = 0,
      g = 0,
      b = 0

    // 3 digits
    if (h.length == 4) {
      r = +('0x' + h[1] + h[1])
      g = +('0x' + h[2] + h[2])
      b = +('0x' + h[3] + h[3])

      // 6 digits
    } else if (h.length == 7) {
      r = +('0x' + h[1] + h[2])
      g = +('0x' + h[3] + h[4])
      b = +('0x' + h[5] + h[6])
    }

    return 'rgba(' + +r + ',' + +g + ',' + +b + ',' + +a + ')'
  }

  $: color = $hovering.color ? hexToRGB($hovering.color, 0.8) : 'white'
</script>

<svelte:window
  on:mousemove={mouseMove}
  on:mousedown={mouseDown}
  on:mouseup={mouseUp}
/>

<div
  class:hidden
  class="cursor-cursor-diff flex"
  class:cursor-diff={!$hovering.color}
  use:styles={{
    x: $coords.x - $size / 2 + 'px',
    y: $coords.y - $size / 2 + 'px',
    size: $size + 'px',
    color,
  }}
>
  {#if $hovering.text}
    <p
      in:fade={{ duration: 200 }}
      class="font-bold font-title m-auto text-sm text-white"
    >
      {$hovering.text}
    </p>
  {/if}
</div>
<div
  class:hidden
  class="cursor-cursor-diff"
  class:cursor-diff={!$hovering.color}
  use:styles={{
    x: coordsAbs.x - $size2 / 2 + 'px',
    y: coordsAbs.y - $size2 / 2 + 'px',
    size: Math.floor($size2) + 'px',
    color,
  }}
/>

<style>
  .cursor-cursor-diff {
    pointer-events: none;
    position: fixed;
    width: var(--size);
    height: var(--size);
    transform: translate3d(var(--x), var(--y), 0);
    background-color: var(--color);
    backface-visibility: hidden;
    border-radius: 50%;
    z-index: 1000000;
    transition: background-color 0.5s;
  }

  .cursor-diff {
    mix-blend-mode: difference;
  }
</style>
