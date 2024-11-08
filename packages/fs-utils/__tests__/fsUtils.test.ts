import { afterEach, beforeEach, expect, it, mock } from 'bun:test'
import nodeFs from 'node:fs/promises'
import Memfs, { vol } from 'memfs'
import fsUtils from '../fsUtils'

const menfs = Memfs.fs.promises

const { ...a } = nodeFs

mock.module('node:fs/promises', () => ({ default: menfs }))

beforeEach(() => {
  vol.fromJSON({
    '/a.txt': 'a.txt',
  })
})

afterEach(() => {
  vol.reset()
})

it('pathExists: none-exist', async () => {
  expect(await fsUtils.pathExists('/none-exist/a.txt')).toBeFalsy()
})

it('pathExists: exist', async () => {
  expect(await fsUtils.pathExists('/a.txt')).toBeTruthy()
})

it('inputFile: none-exist', async () => {
  expect(await fsUtils.inputFile('/none-exist/a.txt', 'utf8')).toBeUndefined()
})

it('inputFile: exist', async () => {
  expect(await fsUtils.inputFile('/a.txt', 'utf8')).toEqual('a.txt')
})

it('outputFile: none-exist', async () => {
  await fsUtils.outputFile('/none-exist/a.txt', 'new')
  expect(await nodeFs.readFile('/none-exist/a.txt', 'utf8')).toEqual('new')
})

it('outputFile: exist', async () => {
  await fsUtils.outputFile('/a.txt', 'new')
  expect(await nodeFs.readFile('/a.txt', 'utf8')).toEqual('new')
})
