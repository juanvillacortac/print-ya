self.window = self

import { browser } from '$app/env'
import type { ModifiersMap, Product, TemplateSource } from '@shackcart/db'
import { getTemplateFieldsFromModifiers } from './modifiers'

const DEFAULT_TEMPLATE_HTML = `<script>
  const image = locals.image || locals.__defaultImage__
  const imageUrl = image ? fillImage(image || '', locals.color || undefined) : ''
  const text = (locals.text || locals.__defaultText__)?.replace(new RegExp('  ', 'g'), '<br/>')
  const textComponent = (text) => text ? \`<p class="\${image ? 'flex-grow !pb-10' : ''} text-center w-full text-6xl">\${text}</p>\`: ''
</script>
<div
  class="overflow-hidden w-full h-full flex items-center {{= image ? \`'justify-between \${text ? 'pt-10' : 'py-10'}\` : 'justify-center' }} flex-col space-y-2 {{= locals.mirror ? 'mirror' : '' }}"
  style="--image: url({{=imageUrl}})"
>
  {{ if (image) { }}<div class="flex h-full bg-red-500 w-full image"></div>{{ } }}
  <script>- textComponent(text) </script>
</div>`

const DEFAULT_TEMPLATE_CSS = `{{ if (locals.font) { }}
@import url('{{= locals.font.url }}');
* {
  font-family: "{{= locals.font.name}}";
}  
{{ } }}

*:not(style) {
  color: {{= locals.color }};
  word-break: break-word;
  text-overflow: hyphens;
}

.mirror {
  transform: scaleX(-1);
}

.image {
  background: var(--image);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}`

function getBasicTemplate<T extends Partial<Product>>(
  product: T,
  modifiers?: ModifiersMap | any
): TemplateSource {
  let customFields = ''
  if (modifiers && product.modifiers) {
    for (const modifier of product.modifiers) {
      if (modifier.id === product.meta.templateTextModifier) {
        modifier.templateAccessor = 'text'
      }
      if (modifier.id === product.meta.templateColorModifier) {
        modifier.templateAccessor = 'color'
      }
      if (modifier.id === product.meta.templateImageModifier) {
        modifier.templateAccessor = 'image'
      }
      if (modifier.id === product.meta.templateMirrorModifier) {
        modifier.templateAccessor = 'mirror'
      }
      if (modifier.id === product.meta.templateFontModifier) {
        modifier.templateAccessor = 'font'
      }
    }
    customFields = getTemplateFieldsFromModifiers(product as any, modifiers)
  }
  let fields = {
    ...JSON.parse(customFields || '{}'),
    __defaultText__: product.meta?.templateText || '',
    __defaultImage__: product.meta?.templateImage || '',
  }

  return {
    html: DEFAULT_TEMPLATE_HTML,
    css: DEFAULT_TEMPLATE_CSS,
    fields: JSON.stringify(fields),
    windi: true,
    width: 13,
    height: 13,
    sizeUnit: 'cm',
  }
}

if (browser) {
  addEventListener(
    'message',
    ({ data }: MessageEvent<{ product: Product; modifiers: ModifiersMap }>) => {
      try {
        postMessage(
          data.product.type === 'template'
            ? getBasicTemplate(data.product, data.modifiers)
            : {
                ...(data.product?.template || {}),
                fields: getTemplateFieldsFromModifiers(
                  data.product,
                  data.modifiers
                ),
              }
        )
      } catch (err) {
        throw new Error(err.message)
      }
    }
  )
}
export {}
