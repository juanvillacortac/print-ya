import type { Writable } from 'svelte/store'
import { browser } from '$app/env'
import { writable, get } from 'svelte/store'

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
  modifiers: Record<string, string>
}
export const bag = persistentWritable<BagItem[]>('cart', [])
