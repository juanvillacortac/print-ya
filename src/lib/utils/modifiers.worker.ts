self.window = self

import { browser } from '$app/env'
import type { Product } from '$lib/db'
import { getTemplateFieldsFromModifiers, type ModifiersMap } from './modifiers'

if (browser) {
  self.window = self
  addEventListener(
    'message',
    ({ data }: MessageEvent<{ product: Product; modifiers: ModifiersMap }>) => {
      try {
        postMessage(
          getTemplateFieldsFromModifiers(data.product, data.modifiers)
        )
      } catch (err) {
        throw new Error(err.message)
      }
    }
  )
}
