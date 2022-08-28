export const load: import('./$types').PageLoad = async ({ parent }) => {
  const {} = await parent()
  return {
    title: 'Analytics',
  }
}
