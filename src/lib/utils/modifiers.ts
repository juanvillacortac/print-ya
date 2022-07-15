import type { Product, ProductModifier } from '$lib/db'
import { writable } from 'svelte/store'
import type { Prisma } from '@prisma/client'

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
