import hb from 'handlebars-esm'
import type Processor from 'windicss'
import { useWindiCSS } from './windicss'

export type CompilerMessage = {
  html: string,
  css: string,
  processor: Processor,
}

export type CompilerPostMessage = {
  html: string,
  css: string,
  fields: string,
}

addEventListener('message', ({ data }: MessageEvent<CompilerPostMessage>) => {
  const template = hb.default.compile(data.html)
  const html = template(JSON.parse(data.fields || '{}'))
  const { processor, generatedCSS } = useWindiCSS(
    data.html,
    data.css,
    null
  )
  postMessage({
    html,
    css: generatedCSS,
    processor,
  })
})
