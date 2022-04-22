import { EditorView, drawSelection, highlightSpecialChars, keymap } from '@codemirror/view'
import { Compartment, EditorState } from '@codemirror/state'
import { history, historyKeymap } from '@codemirror/history'
import { foldGutter, foldKeymap } from '@codemirror/fold'
import { indentOnInput } from '@codemirror/language'
import { lineNumbers } from '@codemirror/gutter'
import { defaultKeymap } from '@codemirror/commands'
import { bracketMatching } from '@codemirror/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { commentKeymap } from '@codemirror/comment'
import { rectangularSelection } from '@codemirror/rectangular-selection'
import { classHighlightStyle } from '@codemirror/highlight'
import { lintKeymap } from '@codemirror/lint'

import { hoverTooltip } from '@codemirror/tooltip'
import type Processor from 'windicss'
import { usePrismCSS } from './usePrismCSS'

const tabSize = new Compartment()

export const basicSetup = [
  lineNumbers(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  classHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  // highlightActiveLine(),
  highlightSelectionMatches(),
  tabSize.of(EditorState.tabSize.of(2)),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
]

export const hoverPreview = (processor: Processor) => {
  return [
    hoverTooltip((view, pos, side) => {
      const { from, to, text } = view.state.doc.lineAt(pos)
      let start = pos; let end = pos
      while (start > from && /[^\s"';`]/.test(text[start - from - 1])) start--
      while (end < to && /[^\s"';`]/.test(text[end - from])) end++
      if ((start === pos && side < 0) || (end === pos && side > 0)) return null
      const word = text.slice(start - from, end - from)
      const result = processor.interpret(word)
      if (result.ignored.length > 0) return null
      return {
        pos: start,
        end,
        above: true,
        create() {
          const dom = document.createElement('div')
          const { highlightedCSS } = usePrismCSS(() => result.styleSheet.build())
          // const highlightedCSS = result.styleSheet.build()
          console.log(result)
          dom.className = 'text-sm p-2'
          dom.innerHTML = `<pre><code>${highlightedCSS}</code></pre>`
          return { dom }
        },
      }
    }),
    EditorView.theme({
      '.cm-tooltip': {
        borderRadius: '0.25rem',
        borderColor: 'var(--c-scrollbar)',
        background: 'var(--c-bg)',
      },
    }),
  ]
}
