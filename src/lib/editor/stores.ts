import type { Editor, Range } from '@tiptap/core'
import type { SvelteComponent } from 'svelte'
import { writable } from 'svelte/store'

export type CommandProps = {
  editor: Editor | null
  range: Range | null
}
export type Item = {
  title: string
  subtitle: string
  icon?: SvelteComponent
  command: (props: CommandProps) => void
}

export const slashVisible = writable(false)
export const slashItems = writable<Item[]>([])
export const slashLocaltion = writable({ x: 0, y: 0, height: 0 })
export const slashProps = writable<CommandProps>({ editor: null, range: null })
