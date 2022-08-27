import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const {
    layoutData: { store },
  } = await parent()
  return {
    title: store!.name,
  }
}
