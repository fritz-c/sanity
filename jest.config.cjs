'use strict'

const path = require('path')
const globby = require('globby')
const pkg = require('./package.json')

const jestConfigFiles = globby.sync(
  pkg.workspaces.map((workspace) => path.join(__dirname, workspace, '/jest.config.cjs'))
)

const IGNORE_PROJECTS = [
  // There are jest/esm issues in `@sanity/server` test suite, so ignore for now
  'packages/@sanity/server',
]

module.exports = {
  projects: jestConfigFiles
    .map((file) => path.relative(__dirname, path.dirname(file)))
    .filter((projectPath) => !IGNORE_PROJECTS.includes(projectPath))
    .map((projectPath) => `<rootDir>/${projectPath}`),
}
