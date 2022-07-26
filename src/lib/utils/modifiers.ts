import type { Product, ProductModifier } from '$lib/db'
import { writable } from 'svelte/store'
import type { Prisma } from '@prisma/client'
import type { TemplateSource } from '$lib/compiler'

export type ModifierValue = {
  value?: any
  itemId?: string
  itemIds?: string[]
  modifier?: ProductModifier
}

export type ModifiersMap = Record<string, ModifierValue>

export const createModifiersMap = (product?: Product): ModifiersMap =>
  product ? product.modifiers?.reduce((a, v) => ({ ...a, [v.id]: {} }), {}) : {}

export const createModifiersMapStore = (product?: Product) =>
  writable<ModifiersMap>(createModifiersMap(product))

export const getTemplateFieldsFromModifiers = (
  product: Product,
  modifiers: ModifiersMap | Prisma.JsonValue
) => {
  let fields = ''
  const mappedModifiers = Object.entries(modifiers || {}).map(
    ([mId, mValue]) =>
      [
        mValue.modifier || product.modifiers?.find((m) => m.id === mId),
        mValue,
      ] as [ProductModifier, { value?: string; itemId?: string }]
  )
  const items = mappedModifiers
    .filter(
      ([m]) =>
        (m.type === 'select' ||
          m.type === 'color' ||
          m.type === 'font' ||
          m.type === 'image' ||
          m.type === 'text' ||
          m.type === 'numeric' ||
          m.type === 'toggle') &&
        m.templateAccessor
    )
    .filter(([_, item]) => item)
    .map(([m, item]) => ({
      value: item.value,
      key: m.templateAccessor,
    }))
  const f = items.reduce((a, b) => ({ ...a, [b.key!]: b.value }), {})
  if (Object.keys(f).length) {
    fields = JSON.stringify(f)
  } else {
    fields = ''
  }
  return fields
}

export const getCostFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap | Prisma.JsonValue,
  cost?: number
) =>
  Object.entries(modifiers || {})
    .filter(([_, mValue]) => mValue?.itemId || mValue?.itemIds)
    .map(([mId, mValue]) => {
      const modifier: ProductModifier | undefined = product.modifiers.find(
        (m) => m.id === mId
      )
      if (mValue.itemIds) {
        const items =
          mValue.itemIds?.map((id) =>
            modifier?.items?.find((i) => i.id === id)
          ) || []
        const costs = items.map((item) =>
          item?.percentage
            ? (item?.cost / 100) * (cost ?? product.price)
            : item?.cost || 0
        )
        return costs.reduce((a, b) => a + b, 0)
      }
      const item = modifier?.items?.find((i) => i.id === mValue.itemId)
      const value = item?.percentage
        ? (item!.cost / 100) * (cost ?? product.price)
        : item?.cost || 0
      return value
    })
    .reduce((a, b) => a + b, 0)

export const getTotalFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap | Prisma.JsonValue,
  cost?: number
) =>
  getCostFromProductModifiers(product, modifiers, cost) +
  (cost ?? product.price)

export const DEFAULT_TEMPLATE_HTML = `<script>
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

export const DEFAULT_TEMPLATE_CSS = `{{ if (locals.font) { }}
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
  modifiers?: ModifiersMap | Prisma.JsonValue
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
