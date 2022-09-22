import { ClusterApplication } from './app/cluster.js'
import { applicationFactory, type ApplicationFactory } from './app/factory.js'

let server: ApplicationFactory | undefined

if (import.meta.env.PROD) {
  const clusterApp = new ClusterApplication(applicationFactory)
  clusterApp.run()
} else {
  server = applicationFactory
}

export { server }
