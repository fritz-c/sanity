/* eslint-disable no-process-env */
import path from 'path'
import {existsSync, readFileSync} from 'fs'
import {spawn, SpawnOptions} from 'child_process'
import {platform, tmpdir} from 'os'
import SanityClient from '@sanity/client'
import which from 'which'

export const cliUserEmail = 'developers+cli-ci@sanity.io'
export const cliUserToken = (process.env.SANITY_CI_CLI_AUTH_TOKEN || '').trim()
export const cliProjectId = 'aeysrmym'

export const hasBuiltCli = existsSync(path.join(__dirname, '..', '..', 'lib', 'cli.js'))
export const fixturesPath = path.join(__dirname, '..', '__fixtures__')
export const studioVersions = ['v2', 'v3'] as const
export const doCleanup = false
export const baseTestPath = path.join(tmpdir(), 'sanity-cli-test')
export const testIdPath = path.join(baseTestPath, 'test-id.txt')
export const studiosPath = path.join(baseTestPath, 'studios')
export const packPath = path.join(baseTestPath, 'packs')
export const cliInstallPath = path.join(baseTestPath, 'install')
export const cliBinPath = path.join(cliInstallPath, 'node_modules', '.bin', 'sanity')
export const sanityEnv = {...process.env, XDG_CONFIG_HOME: path.join(baseTestPath, 'config')}
export const cliConfigPath = path.join(sanityEnv.XDG_CONFIG_HOME, 'sanity', 'config.json')
export const nodeMajorVersion = process.version.split('.')[0]
export const npmPath = which.sync('npm')
export const nodePath = process.execPath

let cachedTestId: string | undefined

/**
 * The generated ID contains enough information to:
 *   - Identify the test run the entity belongs to (duh)
 *   - Automatically clean up dangling entities from previous test runs (timestamp)
 *   - Separate runs in different OSes/node versions from eachother (platform/node major)
 *   - Separate runs in different _executions_ from eachother (process ID/github run ID)
 *
 * We use this test ID as the prefix for entities we create through the tests, and the tests
 * also prefix the studio version in their entities so we can concurrently run tests against
 * multiple studio versions without conflicts.
 *
 * Examples:
 *   - Local : test-20220929-darwin-v16-wode-11664
 *   - GitHub: test-20220929-linux-v14-github-1234
 */
const getTestId = () => {
  if (cachedTestId) {
    return cachedTestId
  }

  const localId = readFileSync(testIdPath, 'utf8').trim()
  const ghId = `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_NUMBER}-${process.env.GITHUB_RUN_ATTEMPT}`
  const githubId = process.env.GITHUB_RUN_ID ? `github-${ghId}` : ''
  const runId = `${githubId || localId}`.replace(/\W/g, '-').replace(/(^-+|-+$)/g, '')
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  cachedTestId = `test-${timestamp}-${platform()}-${nodeMajorVersion}-${runId}`
  return cachedTestId
}

export const testClient = new SanityClient({
  apiVersion: '2022-09-09',
  projectId: cliProjectId,
  dataset: 'production',
  useCdn: false,
  token: cliUserToken,
})

export const getTestRunArgs = (version: string) => {
  const testId = getTestId()
  return {
    sourceStudioPath: path.join(__dirname, '..', '__fixtures__', `${version}-studio`),
    corsOrigin: `https://${testId}-${version}.sanity.build`,
    sourceDataset: 'production',
    dataset: `${testId}-${version}`,
    aclDataset: `${testId}-${version}-acl`,
    datasetCopy: `${testId}-copy-${version}`,
    documentsDataset: `${testId}-docs-${version}`,
    graphqlDataset: `${testId}-graphql-${version}`.replace(/-/g, '_'),
    alias: `${testId}-${version}-alias`,
    graphqlTag: testId,
    exportTarball: 'production.tar.gz',
    importTarballPath: path.join(__dirname, '..', '__fixtures__', 'production.tar.gz'),
    port: version === 'v2' ? 3334 : 3333,
  }
}

export function runSanityCmdCommand(
  version: string,
  args: string[],
  options = {}
): Promise<{
  code: number | null
  stdout: string
  stderr: string
}> {
  return exec(process.argv[0], [cliBinPath, ...args], {
    cwd: path.join(studiosPath, version),
    env: sanityEnv,
    ...options,
  })
}

export function exec(
  command: string,
  args: string[],
  options: Omit<SpawnOptions, 'stdio'>
): Promise<{
  code: number | null
  stdout: string
  stderr: string
}> {
  return new Promise((resolve) => {
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    const proc = spawn(command, args, {...options, stdio: 'pipe'})
    proc.stdout.on('data', (data) => stdout.push(data))
    proc.stderr.on('data', (data) => stderr.push(data))

    proc.on('close', (code) => {
      const stdoutStr = Buffer.concat(stdout).toString('utf8')
      const stderrStr = Buffer.concat(stderr).toString('utf8')

      resolve({code, stdout: stdoutStr, stderr: stderrStr})
    })
  })
}
