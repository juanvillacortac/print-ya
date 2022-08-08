<script context="module" lang="ts">
  export type ProductSorter = {
    prop: keyof NonNullable<InferQueryInput<'products:list'>['orderBy']>
    sort: 'asc' | 'desc'
  }

  export const sorters: Record<
    Exclude<
      keyof NonNullable<InferQueryInput<'products:list'>['orderBy']>,
      'id'
    >,
    {
      asc: ProductSorter
      desc: ProductSorter
    }
  > = {
    createdAt: {
      asc: {
        prop: 'createdAt',
        sort: 'asc',
      },
      desc: {
        prop: 'createdAt',
        sort: 'desc',
      },
    },
    name: {
      asc: {
        prop: 'name',
        sort: 'asc',
      },
      desc: {
        prop: 'name',
        sort: 'desc',
      },
    },
    price: {
      asc: {
        prop: 'price',
        sort: 'asc',
      },
      desc: {
        prop: 'price',
        sort: 'desc',
      },
    },
  }

  export const fetchProducts = (
    {
      storeSlug,
      search,
      categoryId,
      page,
      sortBy = sorters.createdAt.desc,
    }: {
      storeSlug: string
      search?: string
      page?: number
      categoryId?: string
      sortBy?: ProductSorter
    },
    fetcher?: LoadEvent['fetch']
  ) =>
    trpc(fetcher).query('products:list', {
      storeSlug,
      filter: {
        name: search || undefined,
        categoryId: categoryId || undefined,
        public: true,
      },
      page,
      orderBy: {
        [sortBy.prop]: sortBy.sort,
      },
    })
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import trpc, {
    type InferQueryInput,
    type InferQueryOutput,
  } from '$lib/trpc/client'
  import { tick } from 'svelte'
  import { browser } from '$app/env'
  import type { Load, LoadEvent } from '@sveltejs/kit'

  export let products: InferQueryOutput<'products:list'>['products'] | undefined
  export let count: number | undefined
  export let typeDelay = true
  export let search = ''
  export let sortBy: ProductSorter = sorters.createdAt.desc

  let timeout: NodeJS.Timeout
  let waitTimeout: NodeJS.Timeout
  let categoryId = ''
  let visible: boolean | '' = ''

  function filter(..._deps: any[]) {
    const find = async () => {
      waitTimeout = setTimeout(() => {
        // products = undefined
        // count = undefined
        tick()
      }, 100)
      const filtered = await fetchProducts({
        storeSlug: $page.stuff.store!.slug,
        search: search || undefined,
        categoryId: categoryId || undefined,
        sortBy,
      })
      //   const filtered = await trpc().query('products:list', {
      //     storeSlug: $page.stuff.store!.slug,
      //     filter: {
      //       name: search || undefined,
      //       categoryId: categoryId || undefined,
      //       public: visible || undefined,
      //     },
      //     orderBy: {
      //       [sortBy.prop]: sortBy.sort,
      //     },
      //   })
      clearTimeout(waitTimeout)
      products = filtered.products
      count = filtered.count
      typeDelay = true
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    if (typeDelay) {
      timeout = setTimeout(() => find(), 500)
    } else {
      find()
    }
  }

  $: if (browser && sortBy) {
    typeDelay = false
  }

  $: if (browser) {
    filter(search, visible, categoryId, sortBy)
  }
</script>

<slot {products} {count} />
