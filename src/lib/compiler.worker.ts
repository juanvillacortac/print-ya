self.window = self

import { browser } from '$app/env'
import { compile, type TemplateSource } from './compiler'

if (browser) {
  self.window = self
  addEventListener('message', ({ data }: MessageEvent<TemplateSource>) => {
    try {
      postMessage(compile(data))
    } catch (err) {
      throw new Error(err.message)
    }
  })
}
