import trpc from '$lib/trpc/client'
import type { InferQueryOutput } from '@shackcart/trpc'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  let gatewaysKeys: InferQueryOutput<'stores:payment:gatewaysPublicCredentials'> =
    {
      paypal: {
        clientId: '',
      },
      stripe: {
        publicKey: '',
      },
    }
  try {
    gatewaysKeys = await trpc(fetch).query(
      'stores:payment:gatewaysPublicCredentials',
      store?.id || ''
    )
  } catch (err) {}
  return { title: 'Bag', gatewaysKeys }
}
