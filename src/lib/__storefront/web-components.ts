import Accordion from './Accordion.svelte'
import type { SvelteComponent } from 'svelte'
import { browser } from '$app/env'

const init = () => {
  if (!browser) return
  if (customElements.get('store-accordion')) return
  customElements.get('store-accordion')
  customElements.define(
    // I recommend prefixing your custom elements, but for this example
    // I'm keeping it simple.
    'store-accordion',
    class StoreAccordion extends HTMLElement {
      _element: SvelteComponent
      _shadowRoot: ShadowRoot
      _inner: string

      constructor() {
        super()

        this._inner = this.innerHTML
        this.replaceChildren()

        //   Instantiate the Svelte Component
        this._element = new Accordion({
          target: this,
          props: {
            title: this.getAttribute('title') || '',
            html: this._inner,
          },
        })
      }
      connectedCallback(): void {
        // this._element = new Accordion({
        //   target: this._shadowRoot,
        //   props: {
        //     title: 'title',
        //     html: this._inner,
        //   },
        // })
      }
      disconnectedCallback(): void {
        // Destroy the Svelte component when this web component gets
        // disconnected. If this web component is expected to be moved
        // in the DOM, then you need to use `connectedCallback()` and
        // set it up again if necessary.
        // this._element?.$destroy()
      }
    }
  )
}

init()
