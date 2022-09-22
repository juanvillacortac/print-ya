self.window = self

import { browser } from '$app/environment'
import type {
  ModifiersMap,
  Product,
  ProductsGroup,
  TemplateSource,
} from '@shackcart/db'
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

export function getBasicTemplate<T extends Partial<Product>>(
  product: T,
  modifiers?: ModifiersMap | any,
  override?: {
    html?: string
    css?: string
  }
): TemplateSource {
  let customFields = ''
  let modifiersList = product.modifiers || []
  if (product.templateFromGroup) {
    modifiersList = modifiersList.concat(product.group?.modifiers || [])
  }
  const meta: NonNullable<ProductsGroup['meta']> = {
    templateTextModifier: product.templateFromGroup
      ? product.meta.templateTextModifier ||
        product.group?.meta?.templateTextModifier
      : product.meta.templateTextModifier,

    templateColorModifier: product.templateFromGroup
      ? product.meta.templateColorModifier ||
        product.group?.meta?.templateColorModifier
      : product.meta.templateColorModifier,

    templateImageModifier: product.templateFromGroup
      ? product.meta.templateImageModifier ||
        product.group?.meta?.templateImageModifier
      : product.meta.templateImageModifier,

    templateMirrorModifier: product.templateFromGroup
      ? product.meta.templateMirrorModifier ||
        product.group?.meta?.templateMirrorModifier
      : product.meta.templateMirrorModifier,

    templateFontModifier: product.templateFromGroup
      ? product.meta.templateFontModifier ||
        product.group?.meta?.templateFontModifier
      : product.meta.templateFontModifier,

    templateText: product.templateFromGroup
      ? product.meta.templateText || product.group?.meta?.templateText
      : product.meta.templateText,

    templateImage: product.templateFromGroup
      ? product.meta.templateImage || product.group?.meta?.templateImage
      : product.meta.templateImage,

    mockups: [],
  }
  product.group?.meta && product.templateFromGroup
    ? product.group.meta
    : product.meta
  if (modifiers && modifiersList) {
    for (const modifier of modifiersList) {
      if (modifier.id === meta.templateTextModifier) {
        modifier.templateAccessor = 'text'
      }
      if (modifier.id === meta.templateColorModifier) {
        modifier.templateAccessor = 'color'
      }
      if (modifier.id === meta.templateImageModifier) {
        modifier.templateAccessor = 'image'
      }
      if (modifier.id === meta.templateMirrorModifier) {
        modifier.templateAccessor = 'mirror'
      }
      if (modifier.id === meta.templateFontModifier) {
        modifier.templateAccessor = 'font'
      }
    }
    customFields = getTemplateFieldsFromModifiers(product as any, modifiers)
  }
  let fields = {
    ...JSON.parse(customFields || '{}'),
    __defaultText__: meta.templateText || '',
    __defaultImage__: meta.templateImage || '',
  }

  return {
    html: override?.html || DEFAULT_TEMPLATE_HTML,
    css: override?.css || DEFAULT_TEMPLATE_CSS,
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
