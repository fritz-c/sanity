import chalk from 'chalk'
import {createServer, InlineConfig} from 'vite'
import {getViteConfig} from './getViteConfig'
import {debug} from './debug'
import {writeSanityRuntime} from './runtime'

export interface DevServerOptions {
  cwd: string
  basePath: string
  staticPath: string

  httpPort: number
  httpHost?: string
  projectName?: string

  reactStrictMode: boolean
  vite?: (config: InlineConfig) => InlineConfig
}

export interface DevServer {
  close(): Promise<void>
}

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const {cwd, httpPort, httpHost, basePath: base, reactStrictMode, vite: extendViteConfig} = options

  const startTime = Date.now()
  debug('Writing Sanity runtime files')
  await writeSanityRuntime({cwd, reactStrictMode, watch: true})

  debug('Resolving vite config')
  let viteConfig = await getViteConfig({
    basePath: base || '/',
    mode: 'development',
    server: {port: httpPort, host: httpHost},
    cwd,
  })

  if (extendViteConfig) {
    debug('Extending vite config using user-specified function')
    viteConfig = extendViteConfig(viteConfig)
  }

  debug('Creating vite server')
  const server = await createServer(viteConfig)
  const info = server.config.logger.info

  debug('Listening on specified port')
  await server.listen()

  const startupDuration = Date.now() - startTime
  const url = `http://${httpHost || 'localhost'}:${httpPort || '3333'}`
  info(
    `Sanity Studio ` +
      `using ${chalk.cyan(`vite@${require('vite/package.json').version}`)} ` +
      `ready in ${chalk.cyan(`${Math.ceil(startupDuration)}ms`)} ` +
      `and running at ${chalk.cyan(url)}`
  )

  return {close: () => server.close()}
}
