import cuid from 'cuid'
import type {
  ModifiersMap,
  Product,
  ProductModifier,
  TemplateSource,
} from 'src/types.js'

export const getTemplateFieldsFromModifiers = (
  product: Product,
  modifiers: ModifiersMap
) => {
  let fields = ''
  const mappedModifiers = Object.entries(modifiers || {}).map(
    ([mId, mValue]) =>
      [
        mValue.modifier || product.modifiers?.find((m) => m.id === mId),
        mValue,
      ] as [ProductModifier, { value?: string; itemId?: string }]
  )
  const items = mappedModifiers
    .filter(
      ([m]) =>
        (m.type === 'select' ||
          m.type === 'color' ||
          m.type === 'font' ||
          m.type === 'image' ||
          m.type === 'text' ||
          m.type === 'numeric' ||
          m.type === 'toggle') &&
        m.templateAccessor
    )
    .filter(([_, item]) => item)
    .map(([m, item]) => ({
      value: item.value,
      key: m.templateAccessor,
    }))
  const f = items.reduce((a, b) => ({ ...a, [b.key!]: b.value }), {})
  if (Object.keys(f).length) {
    fields = JSON.stringify(f)
  } else {
    fields = ''
  }
  return fields
}

export const getCostFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap,
  cost?: number
) =>
  Object.entries(modifiers || {})
    .filter(([_, mValue]) => mValue?.itemId || mValue?.itemIds)
    .map(([mId, mValue]) => {
      const modifier: ProductModifier | undefined = product.modifiers.find(
        (m) => m.id === mId
      )
      if (mValue.itemIds) {
        const items =
          mValue.itemIds?.map((id) =>
            modifier?.items?.find((i) => i.id === id)
          ) || []
        const costs = items.map((item) =>
          item?.percentage
            ? (item?.cost / 100) * (cost ?? product.price)
            : item?.cost || 0
        )
        return costs.reduce((a, b) => a + b, 0)
      }
      const item = modifier?.items?.find((i) => i.id === mValue.itemId)
      const value = item?.percentage
        ? (item!.cost / 100) * (cost ?? product.price)
        : item?.cost || 0
      return value
    })
    .reduce((a, b) => a + b, 0)

export const getTotalFromProductModifiers = (
  product: Product,
  modifiers: ModifiersMap | any,
  cost?: number
) =>
  getCostFromProductModifiers(product, modifiers, cost) +
  (cost ?? product.price)

export const DEFAULT_TEMPLATE_HTML = `<script>
  const image = locals.image || locals.__defaultImage__
  const imageUrl = image ? fillImage(image || '', locals.color || undefined) : ''
  const text = (locals.text || locals.__defaultText__)?.replace(new RegExp('  ', 'g'), '<br/>')
  const textComponent = (text) => text ? \`<p class="\${image ? 'flex-grow !pb-10' : ''} text-center w-full text-6xl">\${text}</p>\`: ''
</script>
<div
  class="overflow-hidden w-full h-full flex items-center {{= image ? \`'justify-between \${text ? 'pt-10' : 'py-10'}\` : 'justify-center' }} flex-col space-y-2 {{= locals.mirror ? 'mirror' : '' }}"
  style="--image: url({{=imageUrl}})"
>
  {{ if (image) { }}<div class="flex h-full bg-red-500 w-full image"></div>{{ } }}
  <script>- textComponent(text) </script>
</div>`

export const DEFAULT_TEMPLATE_CSS = `{{ if (locals.font) { }}
@import url('{{= locals.font.url }}');
* {
  font-family: "{{= locals.font.name}}";
}  
{{ } }}

*:not(style) {
  color: {{= locals.color }};
  word-break: break-word;
  text-overflow: hyphens;
}

.mirror {
  transform: scaleX(-1);
}

.image {
  background: var(--image);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}`

export function getBasicTemplate<T extends Partial<Product>>(
  product: T,
  modifiers?: ModifiersMap | any
): TemplateSource {
  let customFields = ''
  if (modifiers && product.modifiers) {
    for (const modifier of product.modifiers) {
      if (modifier.id === product.meta.templateTextModifier) {
        modifier.templateAccessor = 'text'
      }
      if (modifier.id === product.meta.templateColorModifier) {
        modifier.templateAccessor = 'color'
      }
      if (modifier.id === product.meta.templateImageModifier) {
        modifier.templateAccessor = 'image'
      }
      if (modifier.id === product.meta.templateMirrorModifier) {
        modifier.templateAccessor = 'mirror'
      }
      if (modifier.id === product.meta.templateFontModifier) {
        modifier.templateAccessor = 'font'
      }
    }
    customFields = getTemplateFieldsFromModifiers(product as any, modifiers)
  }
  let fields = {
    ...JSON.parse(customFields || '{}'),
    __defaultText__: product.meta?.templateText || '',
    __defaultImage__: product.meta?.templateImage || '',
  }

  return {
    html: DEFAULT_TEMPLATE_HTML,
    css: DEFAULT_TEMPLATE_CSS,
    fields: JSON.stringify(fields),
    windi: true,
    width: 13,
    height: 13,
    sizeUnit: 'cm',
  }
}

export const generateDefaultModifiers = () => {
  const textId = cuid()
  const mirrorId = cuid()
  const fontId = cuid()
  const colorId = cuid()
  const imageId = cuid()

  const meta = {
    templateTextModifier: textId,
    templateMirrorModifier: mirrorId,
    templateFontModifier: fontId,
    templateColorModifier: colorId,
    templateImageModifier: imageId,
  }

  const modifiers = [
    {
      id: textId,
      name: 'Custom text',
      active: true,
      type: 'text',
      items: [],
      productId: null,
      templateAccessor: null,
      defaultValue: null,
      meta: {},
    },
    {
      id: colorId,
      name: 'Vinyl Color',
      active: true,
      type: 'color',
      items: [
        {
          name: '#000000',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Matte Black',
          },
        },
        {
          name: '#ffffff',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Gloss White',
          },
        },
        {
          name: '#412773',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Purple',
          },
        },
        {
          name: '#a16e2b',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Copper Metallic',
          },
        },
        {
          name: '#757d7c',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Grey',
          },
        },
        {
          name: '#f2ca00',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Light Yellow',
          },
        },
        {
          name: '#df4a06',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Orange',
          },
        },
        {
          name: '#3da1d2',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Ice Blue',
          },
        },
        {
          name: '#0050a2',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Blue',
          },
        },
        {
          name: '#b0000d',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Red',
          },
        },
        {
          name: '#ed84b6',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Soft Pink',
          },
        },
        {
          name: '#952b6b',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Pink',
          },
        },
        {
          name: '#b893bc',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Lilac Purple',
          },
        },
        {
          name: '#ad9347',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Gold Metallic',
          },
        },
        {
          name: '#9ea09d',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Silver Metallic',
          },
        },
        {
          name: '#5fcdb7',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Mint Teal',
          },
        },
        {
          name: '#6aa72d',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Lime-tree Green',
          },
        },
        {
          name: '#00818c',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Turquoise Blue',
          },
        },
        {
          name: '#004028',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Dark Green',
          },
        },
        {
          name: '#ea6700',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            name: 'Light Orange',
          },
        },
      ] as any,
      productId: null,
      templateAccessor: null,
      defaultValue: null,
      meta: {},
    },
    {
      id: imageId,
      name: 'Custom image',
      active: true,
      type: 'image',
      items: [],
      productId: null,
      templateAccessor: null,
      defaultValue: null,
      meta: {},
    },
    {
      id: fontId,
      name: 'Custom font',
      active: true,
      type: 'font',
      items: [
        {
          name: 'Macondo',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Macondo&display=swap',
            web: true,
          },
        },
        {
          name: 'Macondo',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Macondo&display=swap',
            web: true,
          },
        },
        {
          name: 'Teko',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Teko&display=swap',
            web: true,
          },
        },
        {
          name: 'Blaka',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Blaka&display=swap',
            web: true,
          },
        },
        {
          name: 'Kanit',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Kanit&display=swap',
            web: true,
          },
        },
        {
          name: 'Lobster',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap',
            web: true,
          },
        },
        {
          name: 'Caveat',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Caveat&display=swap',
            web: true,
          },
        },
        {
          name: 'Fredoka One',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap',
            web: true,
          },
        },
        {
          name: 'Bebas Neue',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
            web: true,
          },
        },
        {
          name: 'Anton',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
            web: true,
          },
        },
        {
          name: 'Pacifico',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
            web: true,
          },
        },
        {
          name: 'Alfa Slab One',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap',
            web: true,
          },
        },
        {
          name: 'Righteous',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
            web: true,
          },
        },
        {
          name: 'Staatliches',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Staatliches&display=swap',
            web: true,
          },
        },
        {
          name: 'Press Start 2P',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
            web: true,
          },
        },
        {
          name: 'Ultra',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Ultra&display=swap',
            web: true,
          },
        },
        {
          name: 'Luckiest Guy',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap',
            web: true,
          },
        },
        {
          name: 'Bungee',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap',
            web: true,
          },
        },
        {
          name: 'Berkshire Swash',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap',
            web: true,
          },
        },
        {
          name: 'Neonderthaw',
          cost: 0,
          percentage: false,
          active: true,
          meta: {
            url: 'https://fonts.googleapis.com/css2?family=Neonderthaw&display=swap',
            web: true,
          },
        },
      ] as any,
      productId: null,
      templateAccessor: null,
      defaultValue: null,
      meta: {},
    },
    {
      id: mirrorId,
      name: 'Mirror decal (for placement of decals inside facing outside)',
      active: true,
      type: 'toggle',
      items: [],
      productId: null,
      templateAccessor: null,
      defaultValue: null,
      meta: {},
    },
  ]

  return { meta, modifiers }
}
