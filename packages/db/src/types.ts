import type {
  Customer as _Customer,
  User as _User,
  Store as _Store,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
  Order as _Order,
  OrderFee as _OrderFee,
  OrderItem as _OrderItem,
  Product as _Product,
  ShopifyImport,
  ShopifyImportStatus,
  Account,
  CustomerAddress,
  CustomerAddressType,
  FulfillmentStatus,
  OrderStatus,
  PaymentGateway,
  ProductImage,
  ProductType,
  SearchHistory as _SearchHistory,
  TagsOnProducts,
  ProductTag,
  ProductCategory,
  ProductsGroup as _ProductsGroup,
  CategoriesOnProducts,
} from '@prisma/client'

export {
  _Customer,
  _User,
  _Store,
  _ProductModifier,
  _ProductModifierItem,
  _Order,
  _OrderFee,
  _OrderItem,
  _Product,
  _SearchHistory,
  _ProductsGroup,
  CategoriesOnProducts,
  ProductCategory,
  ShopifyImport,
  ShopifyImportStatus,
  Account,
  CustomerAddress,
  CustomerAddressType,
  FulfillmentStatus,
  OrderStatus,
  PaymentGateway,
  ProductImage,
  ProductType,
  TagsOnProducts,
  ProductTag,
}

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U
export type BestOmit<T, U extends keyof T> = Pick<T, Exclude<keyof T, U>>

export type Store = _Store & {
  contactData?: any
  categories?: (ProductCategory & {
    count: number
  })[]
}

export type User = Omit<_User, 'password'>

export type Customer = _Customer

export type ProductModifierItem = Omit<_ProductModifierItem, 'ordinal'> & {
  meta: any
}

export type ProductModifier = BestOmit<
  _ProductModifier,
  'ordinal' | 'productsGroupId'
> & {
  meta?: any
  items: ProductModifierItem[]
}

export type Product = Overwrite<
  _Product,
  {
    template: any
    meta?: any
    categories: Omit<ProductCategory, 'storeId'>[]
    tags: Omit<ProductTag, 'storeId'>[]
    modifiers: ProductModifier[]
    group: ProductsGroup | null
    mockups: MockupItem[]
  }
>

export type StripedProduct = Overwrite<
  BestOmit<_Product, 'templateDraft'>,
  {
    template: any
    group?: BestOmit<ProductsGroup, 'modifiers' | 'products'> | null
    categories?: Omit<ProductCategory, 'storeId'>[]
    mockups: MockupItem[]
  }
>

export type MockupItem = Record<'path' | 'url', string>

export type ProductsGroup = Overwrite<
  _ProductsGroup,
  {
    mockups: MockupItem[]
    meta?:
      | (Record<string, any> & {
          templateText?: string
          templateTextModifier?: string
          templateColorModifier?: string
          templateImageModifier?: string
          templateMirrorModifier?: string
          templateFontModifier?: string
        })
      | any
    modifiers: ProductModifier[]
    products?: number
  }
>

export type OrderItem = _OrderItem & {
  modifiers: ModifiersMap
  product: StripedProduct
}

export type OrderFee = Omit<_OrderFee, 'id' | 'orderId'>

export type Order = Overwrite<
  _Order,
  {
    customerId?: string
    customer: Customer | null
    billingData?: any
    shippingData?: any
    paymentMethods: string[]
    fees: OrderFee[]
    items: OrderItem[]
  }
>

export type StripedOrder = Overwrite<
  Order,
  {
    customer: Customer | null
    items: _OrderItem[]
  }
>

export type SearchHistory = Overwrite<
  _SearchHistory,
  {
    customer: Customer | null
    category: ProductCategory | null
  }
>

export type LayoutType = 'app' | 'store'
export type StoreData = {
  theme: Record<'primary', string>
  header: {
    links: Record<'title' | 'href', string>[]
  }
  announcementBar: Record<'background' | 'text', string> &
    Partial<Record<'href', string>> & { visible: boolean }
  footer: {
    submit: Record<'title' | 'text', string>
    links: Record<'title' | 'href', string>[]
    appendix: Record<'title' | 'text' | 'img', string>
  }
}

export type LayoutData = {
  layout: LayoutType
  store?: Store | null
  storeData?: StoreData
}

export type ModifierValue = {
  value?: any
  itemId?: string
  itemIds?: string[]
  modifier?: ProductModifier
}

export type ModifiersMap = Record<string, ModifierValue>

export type CompiledTemplate = {
  html: string
  css: string
  width?: string
  height?: string
}

export type TemplateSource = {
  name?: string
  html: string
  css: string
  fields?: string
  windi?: boolean
  width?: number
  height?: number
  sizeUnit?: string
}
