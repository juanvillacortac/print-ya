import { GFetch } from "@juanvillacortac/g-query";

export const g = new GFetch({
  path: '/api/datocms', //whatever your api url is here
  // More config options coming, for now this is just path to your graphql api
})
