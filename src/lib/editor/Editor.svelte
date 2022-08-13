<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Editor, type JSONContent } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import Link from '@tiptap/extension-link'
  import suggestion from './suggestion'
  import Commands from './command'
  import CommandList from './CommandList.svelte'
  import { slashVisible, slashItems, slashProps } from './stores'

  let content = `<p>Hello world 🌎 Type '/' for commands.</p>`
  let output: JSONContent | undefined = undefined
  let isEmpty = true

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
        output = editor.getJSON()
        isEmpty = editor.isEmpty
      },
    })
  })

  $: console.log(output)

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
  .editor {
    @apply p-4;
  }

  .editor :global(a) {
    @apply cursor-pointer text-blue-400;
  }
  .editor :global(a:hover) {
    text-decoration: underline;
  }

  .editor :global(h1),
  .editor :global(h2),
  .editor :global(h3),
  .editor :global(h4),
  .editor :global(h5),
  .editor :global(h6) {
    @apply font-bold font-title;
  }

  .editor :global(h1) {
    @apply text-4xl;
  }
  .editor :global(h2) {
    @apply text-3xl;
  }
  .editor :global(h3) {
    @apply text-2xl;
  }

  .editor :global(ul) {
    @apply list-disc pl-6;
  }
</style>
