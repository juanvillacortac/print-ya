import type { Product, ModifiersMap, ProductModifier } from '@shackcart/db'
import { writable } from 'svelte/store'

export const createModifiersMap = (product?: Product): ModifiersMap =>
  product
    ? [
        ...(product.group?.modifiers || []),
        ...(product?.modifiers || []),
      ].reduce((a, v) => ({ ...a, [v.id]: {} }), {})
    : {}

export const createModifiersMapStore = (product?: Product) =>
  writable<ModifiersMap>(createModifiersMap(product))

export const getTemplateFieldsFromModifiers = (
  product: Product,
  modifiers: ModifiersMap
) => {
  let fields = ''
  const merged = [
    ...(product.group?.modifiers || []),
    ...(product?.modifiers || []),
  ]
  const mappedModifiers = Object.entries(modifiers || {}).map(
    ([mId, mValue]) =>
      [mValue.modifier || merged.find((m) => m.id === mId), mValue] as [
        ProductModifier,
        { value?: string; itemId?: string }
      ]
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
