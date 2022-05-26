<script>
  import { onMount } from 'svelte'
  export let baseFrequency = 0.01,
    type = 'turbulence',
    speed = 350,
    octaveRange = [2, 5],
    seedRange = [2, 5],
    scaleRange = [2, 6]
  let octave, seed, scale

  onMount(() => {
    const wiggle = setInterval(() => {
      octave = randoFromPair(octaveRange[0], octaveRange[1])
      seed = randoFromPair(seedRange[0], seedRange[1])
      scale = randoFromPair(scaleRange[0], scaleRange[1])
    }, speed)
    return () => {
      clearInterval(wiggle)
    }
  })

  function randoFromPair(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
</script>

<div>
  <slot />
</div>

<svg>
  <defs>
    <filter id="squiggly">
      <feTurbulence
        id="turbulence"
        {baseFrequency}
        {type}
        numOctaves={octave}
        result="turbulence"
        {seed}
        stitchTiles="stitch"
      />
      <feDisplacementMap in="SourceGraphic" in2="turbulence" {scale} />
    </filter>
  </defs>
</svg>

<style>
  div {
    display: contents;
  }
  div > :global(*) {
    filter: url('#squiggly');
    -webkit-filter: url('#squiggly');
  }
  svg {
    height: 0;
  }
</style>
