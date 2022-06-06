import type { Product, ProductModifier } from '$lib/db'
import { writable } from 'svelte/store'
import { isEqual } from 'lodash-es'

export type ModifiersMap = Record<
  string,
  { value?: any; itemId?: string; itemIds?: string[] }
>

export const createModifiersMapStore = (product?: Product) =>
  writable<ModifiersMap>(
    product
      ? product.modifiers.reduce((a, v) => ({ ...a, [v.id]: {} }), {})
      : {}
  )

export const compareModifiers = (a: ModifiersMap, b: ModifiersMap) => {
  debugger
  const getKeys = (m: ModifiersMap) =>
    Object.keys(m).filter((k) => Object.values(m[k]).length)
  const [aKeys, bKeys] = [getKeys(a), getKeys(b)]
  if (!isEqual(aKeys, bKeys)) return false
  for (let k of aKeys) {
    const [aObj, bObj] = [a[k], b[k]]
    if (!isEqual(aObj.itemIds, bObj.itemIds)) {
      return false
    }
    if (!isEqual(aObj.itemId, bObj.itemId) || !isEqual(aObj.value, bObj.value))
      return false
  }
  return true
}

export const getTemplateFieldsFromModifiers = (
  product: Product,
  modifiers: ModifiersMap
) => {
  let fields = ''
  const mappedModifiers = Object.entries(modifiers).map(
    ([mId, mValue]) =>
      [product.modifiers.find((m) => m.id === mId), mValue] as [
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
  const f = items.reduce((a, b) => ({ ...a, [b.key]: b.value }), {})
  if (Object.keys(f).length) {
    fields = JSON.stringify(f)
  } else {
    fields = ''
  }
  return fields
}

export const getCostFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap
) =>
  Object.entries(modifiers)
    .filter(([_, mValue]) => mValue?.itemId || mValue?.itemIds)
    .map(([mId, mValue]) => {
      const modifier: ProductModifier = product.modifiers.find(
        (m) => m.id === mId
      )
      if (mValue.itemIds) {
        const items = mValue.itemIds.map((id) =>
          modifier.items.find((i) => i.id === id)
        )
        const costs = items.map((item) =>
          item.percentage ? (item.cost / 100) * product.price : item.cost
        )
        return costs.reduce((a, b) => a + b, 0)
      }
      const item = modifier.items.find((i) => i.id === mValue.itemId)
      const value = item.percentage
        ? (item.cost / 100) * product.price
        : item.cost
      return value
    })
    .reduce((a, b) => a + b, 0)

export const getTotalFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap
) => getCostFromProductModifiers(product, modifiers) + product.price