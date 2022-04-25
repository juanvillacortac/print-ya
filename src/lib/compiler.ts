import ejs from 'ejs'
// import hb from 'handlebars-esm'
import { useWindiCSS } from './windicss'

export type CompiledTemplate = {
  html: string
  css: string
}

export type TemplateSource = {
  html: string
  css: string
  fields?: string
  windi?: boolean
}

export const compile = (source: TemplateSource): CompiledTemplate => {
  try {
    let { html, css, fields } = source
    if (fields.trim()) {
      const payload = JSON.parse(fields || '{}')
      // const script = `<script>\n${Object.entries(payload).map(([k, v]) => `  let ${k} = ${JSON.stringify(v)}`).join('\n')}\n</script>`
      // const component = `${script}\n${data.html}`
      // const { css, js } = compile(component, { generate: 'ssr', hydratable: false })
      // console.log(js.code)
      // const html = await jsx.render(`(props) => (${data.html})`, payload)
      html = ejs.render(
        replaceAll(replaceAll(html, '{{', '<%'), '}}', ' %>'),
        payload
      )
      css = ejs.render(
        replaceAll(replaceAll(css, '{{', '<%'), '}}', ' %>'),
        payload
      )
    }
    if (source.windi) {
      const { generatedCSS } = useWindiCSS(html, css)
      css = generatedCSS
    }
    return {
      html,
      css,
    }
  } catch (err) {
    throw new Error(err.message)
  }
}

function replaceAll(string: string, search: string, replace: string) {
  return string.split(search).join(replace)
}