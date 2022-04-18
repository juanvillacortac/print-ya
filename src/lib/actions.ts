import { layoutStore } from "./stores";
import { layoutDefault } from "./utils/layout";

export const toggleGradientAction = (
  node: HTMLDivElement,
  {
    bgColor,
    gradient,
    threshold,
  }: { gradient?: boolean; bgColor?: string; threshold?: number } = {}
) => {
  const observer = new IntersectionObserver(
    (entries) => {
      layoutStore.update((val) => ({
        ...val,
        bg: bgColor || layoutDefault.bg,
        gradientVisible: gradient || !entries[0].isIntersecting
      }))
    },
    { threshold }
  )
  observer.observe(node)
  return {
    destroy: () => {
      observer.unobserve(node)
      layoutStore.update((val) => ({
        ...val,
        bg: layoutDefault.bg,
        gradientVisible: true
      }))
    },
  }
}

export function styles(node: HTMLElement, styles: Object) {
  setCustomProperties(node, styles)

  return {
    update(styles: Object) {
      setCustomProperties(node, styles)
    },
  }
}

function setCustomProperties(node: HTMLElement, styles: Object) {
  Object.entries(styles).forEach(([key, value]) => {
    node.style.setProperty(`--${key}`, value)
  })
}
