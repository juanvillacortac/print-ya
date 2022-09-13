<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Editor, type JSONContent } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import Link from '@tiptap/extension-link'
  import suggestion from './suggestion'
  import Commands from './command'
  import CommandList from './CommandList.svelte'
  import { slashVisible, slashItems, slashProps } from './stores'

  export let value: string | null | undefined
  let isEmpty = !value?.trim()

  let selectedIndex = 0
  $: selectedIndex = $slashVisible ? selectedIndex : 0

  function handleKeydown(event) {
    if (!$slashVisible) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedIndex =
        (selectedIndex + $slashItems.length - 1) % $slashItems.length
      return true
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedIndex = (selectedIndex + 1) % $slashItems.length
      return true
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      selectItem(selectedIndex)
      return true
    }

    return false
  }

  function selectItem(index) {
    const item = $slashItems[index]

    if (item) {
      let range = $slashProps.range
      item.command({ editor, range })
    }
  }

  let element, editor, w

  onMount(() => {
    editor = new Editor({
      element: element,
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
        },
      },
      content: value || '',
      extensions: [
        StarterKit,
        Link,
        Commands.configure({
          suggestion,
        }),
      ],
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor
      },
      onUpdate: ({ editor }) => {
        value = editor.getHTML()
        isEmpty = editor.isEmpty
      },
    })
  })

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })
</script>

<div class="editor relative">
  {#if isEmpty}
    <p class="font-bold opacity-50 absolute">Type '/' for commands.</p>
  {/if}
  <div bind:this={element} on:keydown|capture={handleKeydown} />
</div>

<CommandList {selectedIndex} />

<style>
  .editor :global(a) {
    @apply cursor-pointer text-blue-400;
  }
  .editor :global(a:hover) {
    text-decoration: underline;
  }

  .editor :global(h1),
  .editor :global(h2),
  .editor :global(h3) {
    @apply font-bold font-title;
  }

  .editor :global(h1) {
    @apply text-2xl;
  }
  .editor :global(h2) {
    @apply text-xl;
  }
  .editor :global(h3) {
    @apply text-lg;
  }

  .editor :global(ul) {
    @apply list-disc pl-6;
  }
</style>
