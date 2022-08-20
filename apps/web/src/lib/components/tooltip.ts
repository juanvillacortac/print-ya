import { navigating } from '$app/stores'
import Tooltip from './Tooltip.svelte'

export function tooltip(
  element: HTMLElement,
  { show = true }: { show?: boolean } = { show: true }
) {
  let title: string = ''
  let tooltipComponent
  function mouseEnter(event: MouseEvent) {
    // NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
    // remember to set it back on `mouseleave`
    title = element.getAttribute('title') || ''
    element.removeAttribute('title')

    tooltipComponent = new Tooltip({
      props: {
        title: title,
        show,
      },
      target: document.body,
    })
    let x = event.pageX
    let y = event.pageY + 5
    if (x + tooltipComponent.width + 10 >= window.innerWidth) {
      x = x - tooltipComponent.width
    }
    if (event.pageY + tooltipComponent.height * 2 >= window.innerHeight) {
      y = y - tooltipComponent.height - 10
    }
    tooltipComponent?.$set({ x, y })
  }
  function mouseMove(event) {
    if (!tooltipComponent) return
    let x = event.pageX
    let y = event.pageY + 5
    if (x + tooltipComponent.width + 20 >= window.innerWidth) {
      x = x - tooltipComponent.width
    }
    if (y + tooltipComponent.height * 2 >= window.innerHeight) {
      y = y - tooltipComponent.height - 10
    }
    tooltipComponent?.$set({ x, y })
  }
  function mouseLeave() {
    tooltipComponent.$destroy()
    // NOTE: restore the `title` attribute
    element.setAttribute('title', title)
  }

  navigating.subscribe((n) => {
    if (n && tooltipComponent) {
      tooltipComponent?.$destroy()
      // NOTE: restore the `title` attribute
      element.setAttribute('title', title)
    }
  })

  element.addEventListener('mouseenter', mouseEnter)
  element.addEventListener('mouseover', mouseMove)
  element.addEventListener('mousemove', mouseMove)
  element.addEventListener('mouseleave', mouseLeave)

  return {
    update(newOpts) {
      show = newOpts.show
      tooltipComponent?.$destroy()
    },
    destroy() {
      tooltipComponent?.$destroy()
      element.removeEventListener('mouseover', mouseEnter)
      element.removeEventListener('mouseover', mouseMove)
      element.removeEventListener('mousemove', mouseMove)
      element.removeEventListener('mouseleave', mouseLeave)
    },
  }
}
