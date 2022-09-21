export const TEST_TEMPLATE_HTML = `<script>
  const text = (locals.text || locals.__defaultText__)?.replace(new RegExp('  ', 'g'), '<br/>')
  const textComponent = (text) => text ? \`<p class="text-center w-full text-6xl !pb-10">\${text}</p>\`: ''
</script>
<div
  class="overflow-hidden w-full h-full flex items-center justify-center {{= text ? 'pt-10' : 'py-10' }} flex-col space-y-2 {{= locals.mirror ? 'mirror' : '' }}"
>
  <div class="flex w-full items-center justify-center">
    <p class="border-current border-dashed font-black border-8 rounded-3xl text-center p-4 text-6xl uppercase">Test<br/>Image</p>
  </div>
  <script>- textComponent(text) </script>
</div>`
