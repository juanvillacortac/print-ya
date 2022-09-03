import { createServer, type tRPCContext } from 'src/shared.js'
import shopifyImport from './shopify-import.js'

const workersRouter = createServer().merge('shopifyImport:', shopifyImport)
export const workerCaller = (ctx: tRPCContext) =>
  workersRouter.createCaller(ctx)
export default workersRouter
