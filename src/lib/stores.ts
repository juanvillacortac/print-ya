import { derived, type Readable, type Writable } from 'svelte/store'
import { browser } from '$app/env'
import { writable, get } from 'svelte/store'
import type { ModifiersMap } from './utils/modifiers'
import type { Product } from './db'

export const pageSubtitle = writable('')

export function persistentWritable<T>(
  key: string,
  initialValue: T
): Writable<T> {
  function replacer(key, value) {
    if (value instanceof Map) {
      return {
        es6: true,
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
      }
    } else {
      return value
    }
  }
  function reviver(key, value) {
    if (typeof value === 'object' && value !== null && value.es6) {
      if (value.dataType === 'Map') {
        return new Map(value.value)
      }
    }
    return value
  }

  // create an underlying store
  const store = writable(initialValue)
  const { subscribe } = store
  // get the last value from localStorage
  const json = browser ? localStorage.getItem(key) : null

  // use the value from localStorage if it exists
  if (json) {
    store.set(JSON.parse(json, reviver))
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      const json = browser ? localStorage.getItem(key) : null

      // use the value from localStorage if it exists
      if (json) {
        store.set(JSON.parse(json, reviver))
      }
    })
  }

  const set = (value: T) => {
    store.set(value)
    if (!browser) return
    localStorage.setItem(key, JSON.stringify(value, replacer))
  }

  // return an object with the same interface as svelte's writable()
  return {
    // capture set and write to localStorage
    set,
    // capture updates and write to localStore
    update(cb: CallableFunction) {
      const value = cb(get(store))
      set(value)
    },
    // punt subscriptions to underlying store
    subscribe,
  }
}

export const preferences = persistentWritable('preferences', {
  darkMode: false,
})

export type BagItem = {
  productSlug: string
  modifiers: ModifiersMap
  quantity: number
}

export type BagStore = Readable<BagItem[]> & {
  addToBag(product: Product, modifiers: ModifiersMap, quantity: number): void
  delete(product: Product, modifiers: ModifiersMap): void
  existInBag(product: Product, modifiers: ModifiersMap): boolean
}

const createBag = (): BagStore => {
  const store = persistentWritable<Map<string, number>>('bag', new Map())
  const items = derived([store], ([s]) =>
    [...s.entries()].map<BagItem>(([k, q]) => ({
      ...JSON.parse(k),
      quantity: q,
    }))
  )

  store.subscribe(console.log)

  return {
    ...items,
    addToBag: (product, modifiers, quantity) =>
      store.update((store) => {
        if (!quantity || quantity < 1) {
          return store
        }
        const key = JSON.stringify({ productSlug: product.slug, modifiers })
        store.set(key, store.get(key) ?? 0)
        return store
      }),
    delete: (product, modifiers) =>
      store.update((store) => {
        const key = JSON.stringify({ productSlug: product.slug, modifiers })
        store.delete(key)
        return store
      }),
    existInBag: (product, modifiers) =>
      Boolean(
        get(store).get(JSON.stringify({ productSlug: product.slug, modifiers }))
      ),
  }
}
export const bag = createBag()
