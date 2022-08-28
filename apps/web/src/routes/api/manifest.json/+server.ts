import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'
import type { Store } from '@shackcart/db'
import trpc from '$lib/trpc/client'

export const GET: RequestHandler = async (event) => {
  let layout = event.locals.layoutType
  const imageBuilder = useCaravaggioBuilder(
    event.url.protocol + '//' + event.url.host
  )
  let store: Store | null = null
  if (layout === 'store') {
    store = (await trpc(fetch, true).query('stores:getByHost', event.url.host))
      .store
    if (!store) {
      let slug = event.url.searchParams.get('store')
      if (!slug) {
        slug = event.url.host.split('.')[0]
      }
      store = (await trpc(fetch, true).query('stores:getBySlug', slug)).store
    }
  }
  const icon = store?.favicon || '/images/logo.svg'
  const iconsRes = [36, 48, 72, 96, 144, 192, 256, 384, 512]
  const getIcon = (res: number) =>
    imageBuilder(icon, {
      o: 'png',
      progressive: true,
      rs: {
        s: `${res}x${res}`,
        g: 'center',
        m: 'embed',
        b: '000000.0',
      },
    })

  return json({
    name: store?.name || 'ShackCart',
    short_name: store?.name || 'ShackCart',
    description: store?.name || 'ShackCart',
    dir: 'auto',
    lang: 'en-US',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    background_color: '#000',
    theme_color: '#000',
    icons: iconsRes.map((s) => ({
      src: getIcon(s),
      sizes: `${s}x${s}`,
      type: 'image/png',
    })),
  })
}
