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
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_URL,
  token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN,
})

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

export function redisWritable<T>(
  initialValue?: T,
  key?: string
): Writable<T> & {
  setKey(key: string): void
} {
  // create an underlying store
  const store = writable(initialValue)
  const keyStore = writable(key)
  const { subscribe } = store

  const updateStore = (key?: string) => {
    const k = key || get(keyStore)
    if (k) {
      redis.get(k).then((d) => {
        console.log(d)
        if (!d) return
        store.set(sj.parse(JSON.stringify(d as string)))
      })
    }
  }

  keyStore.subscribe((key) => {
    updateStore(key)
  })

  if (browser) {
    updateStore()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      updateStore()
    })
  }

  const set = (value: T) => {
    store.set(value)
    if (!browser) return
    const key = get(keyStore)
    if (key) {
      redis.set(get(keyStore), sj.stringify(value))
    }
  }

  // return an object with the same interface as svelte's writable()
  return {
    // capture set and write to localStorage
    set,
    setKey(key: string) {
      keyStore.set(key)
    },
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

const createBag = (customerStore: CustomerStore): BagStore => {
  let store = persistentWritable<Map<string, number>>('bag-v3', new Map())
  let redis = redisWritable<Map<string, number>>(new Map())
  const items = derived([store, redis, customerStore], ([s, r, c]) =>
    [...(c ? r : s).entries()].map<BagItem>(([k, q]) => ({
      ...JSON.parse(k),
      quantity: q,
      key: k,
    }))
  )

  const getStore = () => (get(customerStore) ? redis : store)

  customerStore.subscribe((c) => {
    if (c) {
      redis.setKey(`bag:${c.id}`)
    }
  })

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
    return JSON.stringify(obj, keys.sort())
  }

  const setItem: BagStore['setItem'] = (product, modifiers, quantity) =>
    getStore().update((store) => {
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
        (get(getStore()).get(getKey(product, modifiers)) ?? 0) + quantity
      ),
    delete: (product, modifiers) =>
      getStore().update((store) => {
        store.delete(getKey(product, modifiers))
        return store
      }),
    clear: () =>
      getStore().update(() => {
        return new Map()
      }),
    existInBag: (product, modifiers) =>
      get(getStore()).get(getKey(product, modifiers)) !== undefined,
  }
}

export type Favorites = {
  items(): string[]
  existInFavorites(id: string): boolean
}

export type FavoritesStore = Readable<Favorites> & {
  clear(): void
  delete(id: string): void
  addToFavorites(id: string): void
}

const createFavorites = (customerStore: CustomerStore): FavoritesStore => {
  const store = persistentWritable<Set<string>>('favorites', new Set())
  const redis = redisWritable<Set<string>>(new Set())

  const getStore = () => (get(customerStore) ? redis : store)

  customerStore.subscribe((c) => {
    if (c) {
      redis.setKey(`favorites:${c.id}`)
    }
  })

  const addToFavorites = (id) =>
    getStore().update((store) => {
      store.add(id)
      return store
    })
  const items = derived(
    [store, redis, customerStore],
    ([s, r, c]) =>
      ({
        items: () => [...(c ? r : s)],
        existInFavorites: (id) => (c ? r : s).has(id),
      } as Favorites)
  )

  return {
    ...items,
    addToFavorites,
    delete: (id) =>
      getStore().update((store) => {
        store.delete(id)
        return store
      }),
    clear: () =>
      getStore().update(() => {
        return new Set<string>()
      }),
  }
}

export type CustomerStore = Readable<Customer | null | undefined> & {
  invalidate(): void
}

const createCustomerStore = (): CustomerStore => {
  const tick = writable(Symbol())
  const store = derived<[typeof tick], Customer | null | undefined>(
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

  return {
    ...store,
    invalidate: () => {
      tick.set(Symbol())
    },
  }
}
export const customer = createCustomerStore()
export const bag = createBag(customer)
export const favorites = createFavorites(customer)
