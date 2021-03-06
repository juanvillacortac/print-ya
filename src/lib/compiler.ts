import ejs from 'ejs4b/ejs-es'
import { urlBuilder } from './components/caravaggio/urlBuilder'
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
    console.log('pedo')
    let { html = '', css = '', fields = '' } = source
    const payload = JSON.parse(fields || '{}')
    let replacedHtml = replaceAll(replaceAll(html, '{{', '<%'), '}}', '%>')
    replacedHtml = replaceAll(
      replaceAll(replacedHtml, '<script>', '<%'),
      '</script>',
      '%>'
    )

    const helpers = {
      fillImage: (href: string, color: string = '000000.0') =>
        urlBuilder({ url: 'https://caravaggio-cdn.vercel.app' }, href, {
          progressive: true,
          q: 80,
          o: 'png',
          rs: {
            s: '480x',
          },
          duotone: {
            h: color.replace('#', ''),
            s: color.replace('#', ''),
            o: 1,
          },
        }),
    }

    html = ejs.render(replacedHtml, {
      ...payload,
      ...helpers,
    })
    console.log(html)
    css = ejs.render(replaceAll(replaceAll(css, '{{', '<%'), '}}', ' %>'), {
      ...payload,
      ...helpers,
    })
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
