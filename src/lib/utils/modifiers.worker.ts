self.window = self

import { browser } from '$app/env'
import type { Product } from '$lib/db'
import {
  getBasicTemplate,
  getTemplateFieldsFromModifiers,
  type ModifiersMap,
} from './modifiers'

if (browser) {
  self.window = self
  addEventListener(
    'message',
    ({ data }: MessageEvent<{ product: Product; modifiers: ModifiersMap }>) => {
      try {
        postMessage(
          data.product.type === 'template'
            ? getBasicTemplate(data.product, data.modifiers)
            : {
                ...(data.product?.template || {}),
                fields: getTemplateFieldsFromModifiers(
                  data.product,
                  data.modifiers
                ),
              }
        )
      } catch (err) {
        throw new Error(err.message)
      }
    }
  )
}
