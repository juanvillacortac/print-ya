import { derived, type Readable, type Writable } from 'svelte/store'
import { browser } from '$app/env'
import { writable, get } from 'svelte/store'
import type { ModifiersMap } from './utils/modifiers'
import type { Product } from './db'
import { flatMap, isObject, merge } from 'lodash-es'

export const pageSubtitle = writable<string | null | undefined>('')

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
  key: string
}

export type BagStore = Readable<BagItem[]> & {
  delete(product: Product, modifiers: ModifiersMap): void
  clear(): void
  existInBag(product: Product, modifiers: ModifiersMap): boolean
  setItem(product: Product, modifiers: ModifiersMap, quantity: number): void
  addToBag(product: Product, modifiers: ModifiersMap, quantity: number): void
}

const createBag = (): BagStore => {
  const store = persistentWritable<Map<string, number>>('bag-v2', new Map())
  const items = derived([store], ([s]) =>
    [...s.entries()].map<BagItem>(([k, q]) => ({
      ...JSON.parse(k),
      quantity: q,
      key: k,
    }))
  )

  const getKeys = (val, keys: string[] = []) =>
    isObject(val)
      ? flatMap(val, (v, k) => getKeys(v, [...keys, k]))
      : keys[keys.length - 1]

  const getKey = (product: Product, modifiers: ModifiersMap) => {
    const map: ModifiersMap = {
      ...Object.fromEntries(
        Object.entries(modifiers || {}).map(([mId, v]) => [
          mId,
          { ...v, modifier: product?.modifiers!.find((m) => m.id === mId) },
        ])
      ),
    }
    const obj = { productSlug: product.slug, modifiers: { ...map } }
    const flattenObject = (ob) => {
      let toReturn = {}
      for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue
        if (typeof ob[i] == 'object') {
          let flatObject = flattenObject(ob[i])
          for (let x in flatObject) {
            if (!flatObject.hasOwnProperty(x)) continue
            toReturn[i + '.' + x] = flatObject[x]
          }
        } else {
          toReturn[i] = ob[i]
        }
      }
      return toReturn
    }
    const keys = [
      ...new Set(
        Object.entries(flattenObject(obj || {}))
          .map(([k]) => k.split('.'))
          .flat()
      ),
    ]
    console.log(JSON.stringify(obj, keys.sort()))
    return JSON.stringify(obj, keys.sort())
  }

  const setItem: BagStore['setItem'] = (product, modifiers, quantity) =>
    store.update((store) => {
      if (!quantity || quantity < 0) {
        return store
      }
      const key = getKey(product, modifiers)
      store.set(key, quantity)
      return store
    })

  return {
    ...items,
    setItem,
    addToBag: (product, modifiers, quantity) =>
      setItem(
        product,
        modifiers,
        (get(store).get(getKey(product, modifiers)) ?? 0) + quantity
      ),
    delete: (product, modifiers) =>
      store.update((store) => {
        store.delete(getKey(product, modifiers))
        return store
      }),
    clear: () =>
      store.update(() => {
        return new Map()
      }),
    existInBag: (product, modifiers) =>
      get(store).get(getKey(product, modifiers)) !== undefined,
  }
}
export const bag = createBag()
