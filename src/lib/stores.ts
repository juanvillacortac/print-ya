import type { Writable } from 'svelte/store'
import { browser } from '$app/env'
import { writable, get } from 'svelte/store'
import { compareModifiers, type ModifiersMap } from './utils/modifiers'
import type { Product } from './db'
import { isEqual } from 'lodash-es'

export const pageSubtitle = writable('')

export function persistentWritable<T>(
  key: string,
  initialValue: T
): Writable<T> {
  // create an underlying store
  const store = writable(initialValue)
  const { subscribe } = store
  // get the last value from localStorage
  const json = browser ? localStorage.getItem(key) : null

  // use the value from localStorage if it exists
  if (json) {
    store.set(JSON.parse(json))
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      const json = browser ? localStorage.getItem(key) : null

      // use the value from localStorage if it exists
      if (json) {
        store.set(JSON.parse(json))
      }
    })
  }

  const set = (value: T) => {
    store.set(value)
    if (!browser) return
    localStorage.setItem(key, JSON.stringify(value))
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
  quantity: number
  modifiers: ModifiersMap
}

export type BagStore = Writable<BagItem[]> & {
  addToBag(product: Product, modifiers: ModifiersMap, quantity: number): void
  existInBag(product: Product, modifiers: ModifiersMap): boolean
}

const createBag = (): BagStore => {
  const store = persistentWritable<BagItem[]>('bag', [])
  return {
    ...store,
    addToBag: (product, modifiers, quantity) =>
      store.update((store) => {
        if (!quantity || quantity < 1) {
          return store
        }
        console.log(modifiers)
        if (store.length) {
          console.log(
            compareModifiers(modifiers, store[0].modifiers),
            modifiers,
            store
          )
        }
        const elementIdx = store.findIndex((p) =>
          compareModifiers(modifiers, p.modifiers)
        )
        console.log(elementIdx)
        if (elementIdx >= 0) {
          store[elementIdx].quantity += quantity
        } else {
          store.push({
            productSlug: product.slug,
            modifiers,
            quantity,
          })
        }
        return store
      }),
    existInBag: (product, modifiers) =>
      Boolean(
        get(store).find(
          (p) =>
            p.productSlug == product.slug &&
            JSON.stringify(modifiers) === JSON.stringify(p.modifiers)
        )
      ),
  }
}
export const bag = createBag()
