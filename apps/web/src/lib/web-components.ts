import { browser } from '$app/env'
import Preview from '$lib/components/Preview.svelte'
import Shared from '$lib/components/Shared.svelte'
import type { TemplateSource } from '@shackcart/db'
import type { SvelteComponent } from 'svelte'

const template: TemplateSource = {
  windi: true,
  html: `<div class="flex">
  <div class="box">
    <div class="space-y-2 text-center">
      <div class="space-y-0.5">
        <p class="font-semibold text-lg text-black mb-2 dark:text-white">
          Erin Lindford
        </p>
        <p class="font-medium pb-3 text-gray-500 dark:text-gray-300">
          Product Engineer
        </p>
      </div>
      <button class="btn">
        Message
      </button>
    </div>
  </div>
</div>`,
  css: `.box {
  @apply
    bg-white rounded-xl mx-auto space-y-2
    shadow-md py-8 px-8
    inline-flex dark:bg-gray-400 dark:bg-opacity-10;
}
.btn {
  @apply
    border rounded-full font-semibold border-purple-200 text-sm
    py-1 px-4 ring-purple-600 ring-opacity-40
    text-purple-600 dark:border-purple-800 hover:border-transparent
    hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2;
}`,
}

if (browser) {
  customElements.define(
    // I recommend prefixing your custom elements, but for this example
    // I'm keeping it simple.
    'shackcart-shared',
    class extends HTMLElement {
      _element: SvelteComponent

      constructor() {
        super()

        const shadowRoot = this.attachShadow({ mode: 'open' })

        this._element = new Shared({
          target: shadowRoot,
        })
      }
      disconnectedCallback(): void {
        this._element?.$destroy()
      }
    }
  )
  customElements.define(
    // I recommend prefixing your custom elements, but for this example
    // I'm keeping it simple.
    'shackcart-preview',
    class extends HTMLElement {
      _element: SvelteComponent

      constructor() {
        super()

        // Create the shadow root.
        const shadowRoot = this.attachShadow({ mode: 'open' })

        // Instantiate the Svelte Component
        this._element = new Preview({
          // Tell it that it lives in the shadow root
          target: shadowRoot,
          // Pass any props
          props: {
            // This is the place where you do any conversion between
            // the native string attributes and the types you expect
            // in your svelte components
            template,
          },
        })
      }
      disconnectedCallback(): void {
        // Destroy the Svelte component when this web component gets
        // disconnected. If this web component is expected to be moved
        // in the DOM, then you need to use `connectedCallback()` and
        // set it up again if necessary.
        this._element?.$destroy()
      }
    }
  )
}
