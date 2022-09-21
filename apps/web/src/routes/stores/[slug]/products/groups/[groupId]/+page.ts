import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { group } = await parent()
  return {
    title: group.name,
  }
}
