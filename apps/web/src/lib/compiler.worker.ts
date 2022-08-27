self.window = self

import { browser } from '$app/env'
import { compile } from './compiler'
import type { TemplateSource } from '@shackcart/db'

if (browser) {
  self.window = self
  addEventListener('message', ({ data }: MessageEvent<TemplateSource>) => {
    try {
      postMessage(compile(data))
    } catch (err) {
      console.log(err)
      throw new Error(err.message)
    }
  })
}
