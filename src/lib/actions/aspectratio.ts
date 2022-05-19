export const squareratio = (node: HTMLElement): SvelteActionReturnType => {
  if (CSS.supports('aspect-ratio', '1/1')) {
    return
  }
  const handler = () => {
    const width = node.clientWidth
    node.style.height = `${width}px`
  }
  handler()
  window.addEventListener('resize', handler)
  return {
    destroy: () => {
      window.removeEventListener('resize', handler)
    },
  }
}
