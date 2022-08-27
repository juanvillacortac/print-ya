import type {
  Customer as _Customer,
  User as _User,
  Store as _Store,
  StoreCategory as _StoreCategory,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
  Order as _Order,
  OrderFee as _OrderFee,
  OrderItem as _OrderItem,
  Product as _Product,
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
} from '@prisma/client'

export {
  _Customer,
  _User,
  _Store,
  _StoreCategory,
  _ProductModifier,
  _ProductModifierItem,
  _Order,
  _OrderFee,
  _OrderItem,
  _Product,
  _SearchHistory,
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

export type StoreCategory = _StoreCategory

export type Store = _Store & {
  contactData?: any
  categories?: (StoreCategory & {
    _count: {
      products: number
    }
  })[]
}

export type User = Omit<_User, 'password'>

export type Customer = _Customer

export type ProductModifierItem = Omit<_ProductModifierItem, 'ordinal'> & {
  meta: any
}

export type ProductModifier = Omit<_ProductModifier, 'ordinal'> & {
  meta?: any
  items: ProductModifierItem[]
}

export type Product = _Product & {
  template: any
  meta?: any
  storeCategory: StoreCategory | null
  tags: Omit<ProductTag, 'storeId'>[]
  modifiers: ProductModifier[]
}

export type StripedProduct = Omit<_Product, 'templateDraft'> & {
  template: any
  storeCategory: StoreCategory | null
}

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

export type StrippedOrder = Overwrite<
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
    category: StoreCategory | null
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
