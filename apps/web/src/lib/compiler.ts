import type { CompiledTemplate, TemplateSource } from '@shackcart/db'
import ejs from 'ejs4b/ejs-es'
import { urlBuilder } from './components/caravaggio/urlBuilder'
import { useWindiCSS } from './windicss'

export const compile = (source: TemplateSource): CompiledTemplate => {
  try {
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
