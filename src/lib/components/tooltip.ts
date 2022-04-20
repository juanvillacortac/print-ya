import Tooltip from './Tooltip.svelte'

export function tooltip(element: HTMLElement) {
  let title: string
  let tooltipComponent
  function mouseEnter(event: MouseEvent) {
    // NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
    // remember to set it back on `mouseleave`
    title = element.getAttribute('title')
    element.removeAttribute('title')

    tooltipComponent = new Tooltip({
      props: {
        title: title,
      },
      target: document.body,
    })
    if (event.pageX + tooltipComponent.width >= window.innerWidth) {
      tooltipComponent?.$set({
        x: event.pageX - tooltipComponent.width,
        y: event.pageY,
      })
    } else {
      tooltipComponent?.$set({
        x: event.pageX,
        y: event.pageY,
      })
    }
  }
  function mouseMove(event) {
    if (event.pageX + tooltipComponent.width >= window.innerWidth) {
      tooltipComponent?.$set({
        x: event.pageX - tooltipComponent.width,
        y: event.pageY,
      })
    } else {
      tooltipComponent?.$set({
        x: event.pageX,
        y: event.pageY,
      })
    }
  }
  function mouseLeave() {
    tooltipComponent.$destroy()
    // NOTE: restore the `title` attribute
    element.setAttribute('title', title)
  }

  element.addEventListener('mouseenter', mouseEnter)
  element.addEventListener('mouseleave', mouseLeave)
  element.addEventListener('mousemove', mouseMove)

  return {
    destroy() {
      element.removeEventListener('mouseover', mouseEnter)
      element.removeEventListener('mouseleave', mouseLeave)
      element.removeEventListener('mousemove', mouseMove)
    },
  }
}
