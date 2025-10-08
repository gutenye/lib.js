import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import Memfs, { vol } from 'memfs'
import pathUtils from '../nodePath'

const memfs = Memfs.fs.promises

mock.module('node:fs/promises', () => ({ default: memfs }))

beforeEach(async () => {
  vol.fromNestedJSON({
    '/file.txt': 'file.txt',
  })
})

afterEach(() => {
  vol.reset()
})

describe('nameAddSuffix', () => {
  for (const [fixture, expected] of [
    ['a.txt', 'a-suffix.txt'],
    ['a', 'a-suffix'],
    ['/a.txt', '/a-suffix.txt'],
  ] as const) {
    it(fixture, async () => {
      expect(pathUtils.nameAddSuffix(fixture, '-suffix')).toEqual(expected)
    })
  }
})

describe('replaceName', () => {
  for (const [fixture, expected] of [
    ['a.txt', 'new.txt'],
    ['a', 'new'],
    ['/a.txt', '/new.txt'],
  ] as const) {
    it(fixture, async () => {
      expect(pathUtils.replaceName(fixture, 'new')).toEqual(expected)
    })
  }
})

describe('replaceExt', () => {
  for (const [path, newExt, expected] of [
    ['a.jpg', 'png', 'a.png'],
    ['a', 'png', 'a.png'],
    ['./a.jpg', 'png', 'a.png'],
    ['/a/b.jpg', 'png', '/a/b.png'],
  ] as const) {
    it(path, async () => {
      expect(pathUtils.replaceExt(path, newExt)).toEqual(expected)
    })
  }
})

describe('genUniquePath', () => {
  for (const [fixture, expected] of [
    ['/file.txt', '/file (1).txt'],
    ['/none-exist', '/none-exist'],
  ] as const) {
    it(fixture, async () => {
      expect(await pathUtils.genUniquePath(fixture)).toEqual(expected)
    })
  }
})

describe('hasExt', () => {
  for (const [path, exts, expected] of [
    ['/a.jpg', ['png', 'jpg'], true],
    ['/b.jpg', ['png'], false],
  ] as const) {
    it(path, async () => {
      expect(pathUtils.hasExt(path, exts as unknown as string[])).toEqual(
        expected,
      )
    })
  }
})
