import type { SuggestionOptions } from '@tiptap/suggestion'
import {
  slashVisible,
  slashItems,
  slashLocaltion,
  slashProps,
  type Item,
} from './stores'

const options: Pick<SuggestionOptions, 'render' | 'items'> = {
  render() {
    return {
      onStart: ({ clientRect, editor, range, items }) => {
        if (!clientRect) return
        let location = clientRect()
        if (!location) return
        slashProps.set({ editor, range })
        slashVisible.set(true)
        slashLocaltion.set({
          x: location.x,
          y: location.y,
          height: location.height,
        })
        slashItems.set(items)
      },

      onUpdate({ items }) {
        slashItems.set(items)
      },

      onKeyDown({ event }) {
        if (event.key === 'Escape') {
          slashVisible.set(false)
          return true
        }
        return false
      },

      onExit() {
        slashVisible.set(false)
      },
    }
  },
  items({ query }): Item[] {
    const items: Item[] = [
      {
        title: 'Heading 1',
        subtitle: 'BIG heading',
        command({ editor, range }) {
          if (!editor || !range) return
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 1 })
            .run()
        },
      },
      {
        title: 'Heading 2',
        subtitle: 'Less Big heading',
        command: ({ editor, range }) => {
          if (!editor || !range) return
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 2 })
            .run()
        },
      },
      {
        title: 'Heading 3',
        subtitle: 'Medium big heading',
        command: ({ editor, range }) => {
          if (!editor || !range) return
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 3 })
            .run()
        },
      },
      {
        title: 'Bullet List',
        subtitle: 'Pew pew pew',
        command: ({ editor, range }) => {
          if (!editor || !range) return
          editor.commands.deleteRange(range)
          editor.commands.toggleBulletList()
        },
      },
      {
        title: 'Numbered List',
        subtitle: '1, 2, 3, 4',
        command: ({ editor, range }) => {
          if (!editor || !range) return
          editor.commands.deleteRange(range)
          editor.commands.toggleOrderedList()
        },
      },
    ]
    return items
      .filter((item) =>
        item.title.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 10)
  },
}

export default options
