import Windi from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser, HTMLParser } from 'windicss/utils/parser'

import type { Config } from 'windicss/types/interfaces'

export function useWindiCSS(htmlCode: string, styleCode: string, config: Config | undefined) {
  const processor = new Windi(config)

  const preflightStyles = processor.preflight(htmlCode, true, true, true)

  const transformStyles = new CSSParser(styleCode, processor).parse()

  const utilityStyles = processor.interpret(
    new HTMLParser(htmlCode)
      .parseClasses()
      .map(i => i.result)
      .join(' '),
  ).styleSheet

  const generatedCSS = new StyleSheet()
    .extend(preflightStyles)
    .extend(transformStyles)
    .extend(utilityStyles)
    .sort()
    .build()

  return { processor, generatedCSS }
}
