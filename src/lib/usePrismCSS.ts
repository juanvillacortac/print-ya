import Prism from 'prismjs'
import 'prismjs/components/prism-css'

export function usePrismCSS(getStyle: () => string) {
  const style = getStyle()
  const plainCSS = style
  const highlightedCSS = Prism.highlight(style, Prism.languages.css, 'css').trim()

  return {
    plainCSS,
    highlightedCSS,
  }
}
