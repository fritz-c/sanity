import childProcess from 'child_process'
import NodeEnvironment from 'jest-environment-node'
import {isEqual} from 'lodash'
import ipc from 'node-ipc'
import {ElementHandle, KeyInput, Browser, Page, launch} from 'puppeteer'
import {PortableTextBlock} from '@sanity/types'
import {FLUSH_PATCHES_DEBOUNCE_MS} from '../../src/constants'
import {normalizeSelection} from '../../src/utils/selection'
import type {EditorSelection} from '../../src'

ipc.config.id = 'collaborative-jest-environment-ipc-client'
ipc.config.retry = 1500
ipc.config.silent = true

const WEB_SERVER_ROOT_URL = 'http://localhost:3000'

// Forward debug info from the PTE in the browsers
// const DEBUG = 'sanity-pte:*'
// eslint-disable-next-line no-process-env
const DEBUG = process.env.DEBUG || false

// Wait this long for selections and a new doc revision to appear in the clients.
const SELECTION_TIMEOUT_MS = 300

// How long to wait for a new revision to come back to the client(s) when patched through the server.
// Wait for patch debounce time and some slack for selection adjustment time for everything to be ready
const REVISION_TIMEOUT_MS = FLUSH_PATCHES_DEBOUNCE_MS + SELECTION_TIMEOUT_MS

// eslint-disable-next-line no-process-env
const launchConfig = process.env.CI
  ? {
      headless: true,
      // eslint-disable-next-line no-sync
      executablePath: childProcess.execSync('which chrome', {encoding: 'utf8'}).trim(),
    }
  : {}

export const delay = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export default class CollaborationEnvironment extends NodeEnvironment {
  private _browserA?: Browser
  private _browserB?: Browser
  private _pageA?: Page
  private _pageB?: Page

  public async setup(): Promise<void> {
    await super.setup()
    this._browserA = await launch(launchConfig)
    this._browserB = await launch(launchConfig)
    this._pageA = await this._browserA.newPage()
    this._pageB = await this._browserB.newPage()

    // Hook up page console and npm debug in the PTE
    if (DEBUG) {
      await this._pageA.evaluateOnNewDocument((filter: string) => {
        window.localStorage.debug = filter
      }, DEBUG)
      await this._pageB.evaluateOnNewDocument((filter: string) => {
        window.localStorage.debug = filter
      }, DEBUG)
      this._pageA.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`A:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`)
      )
      this._pageB.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`B:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`)
      )
    }
    this._pageA.on('pageerror', (err) => {
      console.error('Editor A crashed', err)
      throw err
    })
    this._pageB.on('pageerror', (err) => {
      console.error('Editor B crashed', err)
      throw err
    })
    await new Promise<void>((resolve) => {
      ipc.connectToNet('socketServer', () => {
        resolve()
      })
    })
  }

  public async handleTestEvent(event: {name: string}): Promise<void> {
    if (event.name === 'test_start') {
      await this._setupInstance()
    }
  }

  public async teardown(): Promise<void> {
    await super.teardown()
    this._browserA?.close()
    this._browserB?.close()
    ipc.disconnect('socketServer')
  }

  private async _setupInstance(): Promise<void> {
    const testId = (Math.random() + 1).toString(36).substring(7)
    await this._pageA?.goto(`${WEB_SERVER_ROOT_URL}?editorId=A${testId}&testId=${testId}`)
    await this._pageB?.goto(`${WEB_SERVER_ROOT_URL}?editorId=B${testId}&testId=${testId}`)
    this.global.setDocumentValue = async (
      value: PortableTextBlock[] | undefined
    ): Promise<void> => {
      ipc.of.socketServer.emit('payload', JSON.stringify({type: 'value', value, testId}))
      await delay(REVISION_TIMEOUT_MS) // Wait a little here for the payload to reach the clients
      const [valueHandleA, valueHandleB] = await Promise.all([
        this._pageA?.waitForSelector('#pte-value'),
        this._pageB?.waitForSelector('#pte-value'),
      ])

      if (!valueHandleA || !valueHandleB) {
        throw new Error('Failed to find `#pte-value` element on page')
      }

      const readVal = (node: any) => {
        return node.innerText ? JSON.parse(node.innerText) : undefined
      }
      if (valueHandleA === null || valueHandleB === null) {
        throw new Error('Value handle is null')
      }
      const valueA: PortableTextBlock[] | undefined = await valueHandleA.evaluate(readVal)
      const valueB: PortableTextBlock[] | undefined = await valueHandleB.evaluate(readVal)
      return new Promise<void>((resolve, reject) => {
        if (isEqual(value, valueA) && isEqual(value, valueB)) {
          return resolve()
        }
        return reject(new Error('Could not propagate value to browsers'))
      })
    }
    this.global.getEditors = () =>
      Promise.all(
        [this._pageA!, this._pageB!].map(async (page, index) => {
          const userAgent = await page.evaluate(() => navigator.userAgent)
          const isMac = /Mac|iPod|iPhone|iPad/.test(userAgent)
          const metaKey = isMac ? 'Meta' : 'Control'
          const editorId = `${['A', 'B'][index]}${testId}`
          const [editableHandle, selectionHandle, valueHandle]: (ElementHandle<Element> | null)[] =
            await Promise.all([
              page.waitForSelector('div[contentEditable="true"]'),
              page.waitForSelector('#pte-selection'),
              page.waitForSelector('#pte-value'),
            ])

          if (!editableHandle || !selectionHandle || !valueHandle) {
            throw new Error('Failed to find required editor elements')
          }

          const waitForRevision = async () => {
            const revId = (Math.random() + 1).toString(36).substring(7)
            ipc.of.socketServer.emit(
              'payload',
              JSON.stringify({type: 'revId', revId, testId, editorId})
            )
            await page.waitForSelector(`code[data-rev-id="${revId}"]`, {
              timeout: REVISION_TIMEOUT_MS,
            })
          }
          const getSelection = async (): Promise<EditorSelection | null> => {
            const selection = await selectionHandle.evaluate((node) =>
              node instanceof HTMLElement && node.innerText ? JSON.parse(node.innerText) : null
            )
            return selection
          }
          const waitForNewSelection = async (selectionChangeFn: () => Promise<void>) => {
            const oldSelection = await getSelection()
            const dataVal = oldSelection ? JSON.stringify(oldSelection) : 'null'
            await selectionChangeFn()
            await page.waitForSelector(`code[data-selection]:not([data-selection='${dataVal}'])`, {
              timeout: SELECTION_TIMEOUT_MS,
            })
          }

          const waitForSelection = async (selection: EditorSelection) => {
            const value = await valueHandle.evaluate((node): PortableTextBlock[] | undefined =>
              node instanceof HTMLElement && node.innerText ? JSON.parse(node.innerText) : undefined
            )
            const normalized = normalizeSelection(selection, value)
            const dataVal = JSON.stringify(normalized)
            await page.waitForSelector(`code[data-selection='${dataVal}']`, {
              timeout: SELECTION_TIMEOUT_MS,
            })
          }
          return {
            testId,
            editorId,
            insertText: async (text: string) => {
              // await delay(generateRandomInteger(0, 100))
              await Promise.all([
                waitForRevision(),
                waitForNewSelection(async () => {
                  await editableHandle.evaluate(
                    (node, args) => {
                      node.dispatchEvent(
                        new InputEvent('beforeinput', {
                          bubbles: true,
                          cancelable: true,
                          inputType: 'insertText',
                          data: args[0],
                        })
                      )
                    },
                    [text]
                  )
                }),
              ])
            },
            undo: async () => {
              await page.keyboard.down(metaKey)
              await page.keyboard.press('z')
              await page.keyboard.up(metaKey)
              await waitForRevision()
            },
            redo: async () => {
              await page.keyboard.down(metaKey)
              await page.keyboard.press('y')
              await page.keyboard.up(metaKey)
              await waitForRevision()
            },
            pressKey: async (keyName: KeyInput, times?: number) => {
              // await delay(generateRandomInteger(0, 100))
              const pressKey = async () => {
                await editableHandle.press(keyName)
              }
              for (let i = 0; i < (times || 1); i++) {
                // Value manipulation keys
                if (
                  keyName.length === 1 ||
                  keyName === 'Backspace' ||
                  keyName === 'Delete' ||
                  keyName === 'Enter'
                ) {
                  await pressKey()
                  await waitForRevision()
                } else if (
                  // Selection manipulation keys
                  [
                    'ArrowUp',
                    'ArrowDown',
                    'ArrowLeft',
                    'ArrowRight',
                    'PageUp',
                    'PageDown',
                    'Home',
                    'End',
                  ].includes(keyName)
                ) {
                  await waitForNewSelection(pressKey)
                } else {
                  // Unknown keys, test needs should be covered by the above cases.
                  console.warn(`Key ${keyName} not accounted for`)
                  await pressKey()
                }
              }
            },
            toggleMark: async () => {
              await page.keyboard.down(metaKey)
              await page.keyboard.down('b')

              await page.keyboard.up('b')
              await page.keyboard.up(metaKey)
              await waitForRevision()
            },
            focus: async () => {
              await editableHandle.focus()
            },
            setSelection: async (selection: EditorSelection | null) => {
              ipc.of.socketServer.emit(
                'payload',
                JSON.stringify({
                  type: 'selection',
                  selection,
                  testId,
                  editorId,
                })
              )
              await delay(REVISION_TIMEOUT_MS) // Wait a little here for the payload to reach the client
              await waitForSelection(selection)
            },
            async getValue(): Promise<PortableTextBlock[] | undefined> {
              const value = await valueHandle.evaluate((node): PortableTextBlock[] | undefined =>
                node instanceof HTMLElement && node.innerText
                  ? JSON.parse(node.innerText)
                  : undefined
              )
              return value
            },
            getSelection,
          }
        })
      )
  }
}
