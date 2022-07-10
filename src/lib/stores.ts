import { derived, type Readable, type Writable } from 'svelte/store'
import { browser } from '$app/env'
import { writable, get } from 'svelte/store'
import type { ModifiersMap } from './utils/modifiers'
import type { Product } from './db'
import { flatMap, isObject, merge } from 'lodash-es'
import type { Customer, Prisma } from '@prisma/client'
import { page, session } from '$app/stores'
import { goto } from '$app/navigation'
import * as sj from 'superjson'
import trpc from './trpc/client'

export function createQueryStore<T = any>(prop: string): Writable<T> {
  let query: Record<string, any> = {}
  const set = (v) => {
    query[prop] = v
    const urlSearchParams = new URLSearchParams(query)
    const g = `?${urlSearchParams.toString()}`
    goto(g, { keepfocus: true, replaceState: true, noscroll: true })
  }
  return {
    subscribe: (h) => {
      return page.subscribe((p) => {
        query = Object.fromEntries(p.url.searchParams.entries())
        h(query[prop])
      })
    },
    update(cb: CallableFunction) {
      const value = cb(query[prop])
      set(value)
    },
    set,
  }
}

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
    store.set(sj.parse(json))
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      const json = browser ? localStorage.getItem(key) : null

      // use the value from localStorage if it exists
      if (json) {
        store.set(sj.parse(json))
      }
    })
  }

  const set = (value: T) => {
    store.set(value)
    if (!browser) return
    localStorage.setItem(key, sj.stringify(value))
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

export const preferences = persistentWritable('preferences-v2', {
  darkMode: false,
})

export type BagItem = {
  productSlug: string
  modifiers: ModifiersMap | Prisma.JsonValue
  quantity: number
  key: string
}

export type BagStore = Readable<BagItem[]> & {
  clear(): void
  delete(product: Product, modifiers: ModifiersMap | Prisma.JsonValue): void
  existInBag(product: Product, modifiers: ModifiersMap): boolean
  setItem(
    product: Product,
    modifiers: ModifiersMap | Prisma.JsonValue,
    quantity: number
  ): void
  addToBag(product: Product, modifiers: ModifiersMap, quantity: number): void
}

const createBag = (): BagStore => {
  const store = persistentWritable<Map<string, number>>('bag-v3', new Map())
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

  const getKey = (
    product: Product,
    modifiers: ModifiersMap | Prisma.JsonValue
  ) => {
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

export type Favorites = {
  items(): string[]
  existInFavorites(id: string): boolean
}

export type FavoritesStore = Readable<Favorites> & {
  clear(): void
  delete(id: string): void
  addToFavorites(id: string): void
}

const createFavorites = (): FavoritesStore => {
  const store = persistentWritable<Set<string>>('favorites', new Set())
  const addToFavorites = (id) =>
    store.update((store) => {
      store.add(id)
      return store
    })
  const items = derived<[typeof store], Favorites>(
    [store],
    ([s]) =>
      ({
        items: () => [...s],
        existInFavorites: (id) => s.has(id),
      } as Favorites)
  )

  return {
    ...items,
    addToFavorites,
    delete: (id) =>
      store.update((store) => {
        store.delete(id)
        return store
      }),
    clear: () =>
      store.update(() => {
        return new Set<string>()
      }),
  }
}
export const favorites = createFavorites()

export type CustomerStore = Readable<Customer | null | undefined> & {
  invalidate(): void
}

const createCustomerStore = (): CustomerStore => {
  const tick = writable(Symbol())
  const createStore = () =>
    derived<[typeof tick], Customer | null | undefined>(
      [tick],
      (_, set) => {
        if (!browser) {
          set(null)
          return
        }

        trpc()
          .query('customer:whoami')
          .then((c) => {
            console.log(c)
            set(c)
          })
      },
      undefined
    )

  let store = createStore()

  store.subscribe((s) => console.log(s))

  return {
    ...store,
    invalidate: () => {
      tick.set(Symbol())
    },
  }
}
export const customer = createCustomerStore()
