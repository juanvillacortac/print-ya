<script lang="ts">
  import { useCaravaggioBuilder } from './caravaggio/useCaravaggio'

  export let favicon: string
  export let themeColor: string = ''
  export let titleName: string = ''

  const imageBuilder = useCaravaggioBuilder()

  $: getIcon = (res: number) =>
    imageBuilder(favicon, {
      o: 'png',
      progressive: true,
      rs: {
        s: `${res}x${res}`,
        g: 'center',
        m: 'embed',
        b: '000000.0',
      },
    })
</script>

<svelte:head>
  <link rel="shortcut icon" href={getIcon(128)} />
  <link rel="icon" type="image/png" sizes="16x16" href={getIcon(16)} />
  <link rel="icon" type="image/png" sizes="32x32" href={getIcon(32)} />
  <link rel="icon" type="image/png" sizes="48x48" href={getIcon(48)} />
  <link rel="icon" type="image/png" sizes="228x228" href={getIcon(228)} />
  <link rel="manifest" href="/web-manifest.json" />
  <meta name="mobile-web-app-capable" content="yes" />
  {#if themeColor}
    <meta name="theme-color" content={themeColor} />
  {/if}
  <link rel="apple-touch-icon" sizes="57x57" href={getIcon(57)} />
  <link rel="apple-touch-icon" sizes="60x60" href={getIcon(60)} />
  <link rel="apple-touch-icon" sizes="72x72" href={getIcon(72)} />
  <link rel="apple-touch-icon" sizes="76x76" href={getIcon(76)} />
  <link rel="apple-touch-icon" sizes="114x114" href={getIcon(114)} />
  <link rel="apple-touch-icon" sizes="120x120" href={getIcon(120)} />
  <link rel="apple-touch-icon" sizes="144x144" href={getIcon(144)} />
  <link rel="apple-touch-icon" sizes="152x152" href={getIcon(152)} />
  <link rel="apple-touch-icon" sizes="167x167" href={getIcon(167)} />
  <link rel="apple-touch-icon" sizes="180x180" href={getIcon(180)} />
  <link rel="apple-touch-icon" sizes="1024x1024" href={getIcon(1024)} />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content={titleName} />
</svelte:head>
