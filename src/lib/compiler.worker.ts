import { browser } from '$app/env'
// import hb from 'handlebars-esm'
import ejs from 'ejs'
import { useWindiCSS } from './windicss'
import type Processor from 'windicss'

export type CompilerMessage = {
  html: string
  css: string
  processor: Processor
}

export type CompilerPostMessage = {
  html: string
  css: string
  fields: string
}

if (browser) {
  addEventListener('message', ({ data }: MessageEvent<CompilerPostMessage>) => {
    try {
      // const template = hb.default.compile(data.html)
      // const html = template(JSON.parse(data.fields || '{}'))
      const html = ejs.render(data.html, JSON.parse(data.fields || '{}'))
      const { generatedCSS } = useWindiCSS(data.html, data.css)
      postMessage({
        html,
        css: generatedCSS,
      })
    } catch (err) {
      throw new Error(err.message)
    }
  })
}
