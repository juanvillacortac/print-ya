self.window = self

import { browser } from '$app/env'
// import hb from 'handlebars-esm'
import { compile } from 'svelte/compiler'
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
      const payload = JSON.parse(data.fields || '{}')
      const { generatedCSS } = useWindiCSS(data.html, data.css)
      // const script = `<script>\n${Object.entries(payload).map(([k, v]) => `  let ${k} = ${JSON.stringify(v)}`).join('\n')}\n</script>`
      // const component = `${script}\n${data.html}`
      // const { css, js } = compile(component, { generate: 'ssr', hydratable: false })
      // console.log(js.code)
      // const html = await jsx.render(`(props) => (${data.html})`, payload)
      const html = ejs.render(replaceAll(replaceAll(data.html, '{{', '<%'), '}}', ' %>'), payload)
      postMessage({
        html,
        css: generatedCSS,
      })
    } catch (err) {
      throw new Error(err.message)
    }
  })
}

function replaceAll(string: string, search: string, replace: string) {
  return string.split(search).join(replace);
}
