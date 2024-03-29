import { derived, type Readable, type Writable } from 'svelte/store'
import { browser } from '$app/environment'
import { writable, get } from 'svelte/store'
import type {
  Order,
  Product,
  Store,
  Customer,
  ModifiersMap,
  LayoutData,
} from '@shackcart/db'
import { flatMap, isObject, merge } from 'lodash-es'
import { page } from '$app/stores'
import { goto } from '$app/navigation'
import * as sj from 'superjson'
import trpc from './trpc/client'
import { Redis } from '@upstash/redis'
import {
  PUBLIC_UPSTASH_REDIS_TOKEN,
  PUBLIC_UPSTASH_REDIS_URL,
} from '$env/static/public'

const redis = new Redis({
  url: PUBLIC_UPSTASH_REDIS_URL,
  token: PUBLIC_UPSTASH_REDIS_TOKEN,
})

type Media<Query extends Record<string, string> = Record<string, string>> = {
  [K in keyof Query]?: boolean | string
} & {
  classNames: string
}

type MediaQueryLists = Record<string, MediaQueryList>

function calculateMedia(mqls: MediaQueryLists) {
  let media: Media = { classNames: '' }
  let mediaClasses: string[] = []
  for (let name in mqls) {
    media[name] = mqls[name].matches
    if (media[name]) {
      mediaClasses.push(`media-${name}`)
    }
  }
  media.classNames = mediaClasses.join(' ')
  return media
}

export function watchMedia<Query extends Record<string, string>>(
  mediaqueries: Query
) {
  return writable<Media<Query>>({ classNames: '' }, (set) => {
    if (typeof window === 'undefined') return
    let mqls: MediaQueryLists = {}
    let updateMedia = () => set(calculateMedia(mqls))
    for (let key in mediaqueries) {
      let foo = window.matchMedia(mediaqueries[key])
      mqls[key] = foo
      mqls[key].addListener(updateMedia)
    }
    updateMedia()
    return () => {
      for (let key in mqls) {
        mqls[key].removeListener(updateMedia)
      }
    }
  })
}

export function createQueryStore<T = any>(prop: string): Writable<T> {
  let query: Record<string, any> = {}
  const set = (v) => {
    // if (v) {
    query[prop] = v || ''
    // } else {
    //   delete query[prop]
    // }
    if (!browser) return
    const urlSearchParams = new URLSearchParams(query)
    const g = `?${urlSearchParams.toString()}`
    if (g !== window.location.search)
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
  modifiers: ModifiersMap
  quantity: number
  key: string
}

export type BagStore = Readable<BagItem[]> & {
  clear(): void
  delete(product: Product, modifiers: ModifiersMap): void
  existInBag(product: Product, modifiers: ModifiersMap): boolean
  restoreBag(
    items: {
      product: Product
      modifiers: ModifiersMap
      quantity: number
    }[]
  ): void
  setItem(
    product: Product,
    modifiers: ModifiersMap,
    newModifiers: ModifiersMap
  ): void
  setItem(product: Product, modifiers: ModifiersMap, quantity: number): void
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
    return JSON.stringify(obj, keys.sort())
  }

  const restoreBag = (
    items: {
      product: Product
      modifiers: ModifiersMap
      quantity: number
    }[]
  ) =>
    getStore().update((store) => {
      const newStore = new Map<string, number>()
      for (const { product, modifiers, quantity } of items) {
        const key = getKey(product, modifiers)
        newStore.set(key, quantity)
      }
      return newStore
    })

  const setItem = (
    product: Product,
    modifiers: ModifiersMap,
    value: ModifiersMap | number
  ) =>
    getStore().update((store) => {
      if (typeof value === 'number') {
        const quantity = value
        if (!quantity || quantity < 0) {
          return store
        }
        const key = getKey(product, modifiers)
        store.set(key, quantity)
        return store
      }
      const oldKey = getKey(product, modifiers)
      const newKey = getKey(product, value)
      const newStore = new Map<string, number>()
      for (const [k, v] of store.entries()) {
        if (k == oldKey) {
          newStore.set(newKey, v)
        } else {
          newStore.set(k, v)
        }
      }
      return newStore
    })

  return {
    ...items,
    setItem,
    restoreBag,
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

const createOrderStore = (
  customerStore: CustomerStore
): Writable<Order | null> => {
  const store = persistentWritable<Order | null>('currentOrder', null)
  const redis = redisWritable<Order | null>(null)

  const readStore = derived([store, redis, customerStore], ([s, r, c]) =>
    c ? r : s
  )

  const getStore = () => (get(customerStore) ? redis : store)

  customerStore.subscribe((c) => {
    if (c) {
      redis.setKey(`currentOrder:${c.id}`)
    }
  })

  const set = (value: Order | null) => getStore().set(value)

  return {
    ...readStore,
    set,
    update(cb: CallableFunction) {
      set(cb(get(store)))
    },
  }
}

export const customer = createCustomerStore()
export const bag = createBag(customer)
export const favorites = createFavorites(customer)
export const currentOrder = createOrderStore(customer)

export const createLayoutStore = ({
  initialState,
  editable,
  store: s,
}: {
  initialState?: Partial<StoreData>
  editable?: boolean
  store?: Store
}): Writable<StoreData> => {
  const defaultData: StoreData = {
    header: {
      links: [],
    },
    announcementBar: {
      background: '#00FFF4',
      text: 'Create a Custom Text Decal',
      href: '/products',
      visible: true,
    },
    theme: {
      primary: '#5D2847',
    },
    footer: {
      submit: {
        title: 'Stay In The Loop',
        text: `Become a Decals Hut Insider and get 10% off your order today. Plus we'll keep you up-to-date with the latest designs.`,
      },
      links: [
        {
          title: 'Home',
          href: '/',
        },
      ],
      appendix: {
        title: 'Secure Checkout',
        text: 'We use encrypted SSL security to ensure that your credit card information is 100% protected.',
        img: 'https://cdn.shopify.com/s/files/1/0263/8249/9885/t/2/assets/ff-checkout-single.png?v=151997186021135005011631037864',
      },
    },
  }
  const store = writable<StoreData>({
    header: {
      ...(defaultData.header || {}),
      ...(initialState?.header || {}),
    },
    announcementBar: {
      ...(defaultData.announcementBar || {}),
      ...(initialState?.announcementBar || {}),
    },
    theme: {
      ...defaultData.theme,
      ...(initialState?.theme || {}),
    },
    footer: {
      ...defaultData.footer,
      ...(initialState?.footer || {}),
      appendix: {
        ...defaultData.footer.appendix,
        ...(initialState?.footer?.appendix || {}),
      },
      submit: {
        ...defaultData.footer.submit,
        ...(initialState?.footer?.submit || {}),
      },
    },
  })
  const set = (value: StoreData) => {
    store.set(value)
    if (!browser) return
    if (editable && s) {
      redis.set(`storeData:${s.id}`, sj.stringify(value))
    }
  }
  return {
    ...store,
    set,
    update: (cb) => {
      set(cb(get(store)))
    },
  }
}

export const layoutData = derived([page], ([page]): LayoutData => {
  const layoutData: LayoutData | undefined = page.data.layoutData
  return {
    layout: layoutData?.layout || 'app',
    store: layoutData?.store,
    storeData: layoutData?.storeData,
  }
})
