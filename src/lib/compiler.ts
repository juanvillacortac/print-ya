import ejs from 'ejs'
import { urlBuilder } from './components/caravaggio/urlBuilder'
import {
  useCaravaggio,
  useCaravaggioBuilder,
} from './components/caravaggio/useCaravaggio'
// import hb from 'handlebars-esm'
import { useWindiCSS } from './windicss'

export type CompiledTemplate = {
  html: string
  css: string
  width?: string
  height?: string
}

export type TemplateSource = {
  name?: string
  html: string
  css: string
  fields?: string
  windi?: boolean
  width?: number
  height?: number
  sizeUnit?: string
}

export const compile = (source: TemplateSource): CompiledTemplate => {
  try {
    let { html = '', css = '', fields = '' } = source
    // if (fields?.trim()) {
    const payload = JSON.parse(fields || '{}')
    // const script = `<script>\n${Object.entries(payload).map(([k, v]) => `  let ${k} = ${JSON.stringify(v)}`).join('\n')}\n</script>`
    // const component = `${script}\n${data.html}`
    // const { css, js } = compile(component, { generate: 'ssr', hydratable: false })
    // console.log(js.code)
    // const html = await jsx.render(`(props) => (${data.html})`, payload)
    let replacedHtml = replaceAll(replaceAll(html, '{{', '<%'), '}}', ' %>')
    replacedHtml = replaceAll(
      replaceAll(replacedHtml, '<script>', '<%'),
      '</script>',
      ' %>'
    )
    replacedHtml = replaceAll(replacedHtml, '<script=>', '<%=')
    replacedHtml = replaceAll(replacedHtml, '<script =>', '<%=')
    replacedHtml = replaceAll(replacedHtml, '<script->', '<%-')
    replacedHtml = replaceAll(replacedHtml, '<script ->', '<%-')
    html = ejs.render(replacedHtml, {
      ...payload,
      fillImage: (href: string, color: string = '000000.0') =>
        urlBuilder({ url: 'https://caravaggio-cdn.vercel.app' }, href, {
          progressive: true,
          q: 90,
          o: 'png',
          rs: {
            s: '0.8x',
          },
          duotone: {
            h: color.replace('#', ''),
            s: color.replace('#', ''),
            o: 1,
          },
        }),
    })
    console.log(html)
    css = ejs.render(
      replaceAll(replaceAll(css, '{{', '<%'), '}}', ' %>'),
      payload
    )
    // }
    if (source.windi || source.windi === undefined) {
      const { generatedCSS } = useWindiCSS(html, css)
      css = generatedCSS
    }
    return {
      width: `${source.width}${source.sizeUnit}`,
      height: `${source.height}${source.sizeUnit}`,
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
