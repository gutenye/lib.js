import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import nodeFs from 'node:fs/promises'
import Memfs, { vol } from 'memfs'
import fsUtils from '../fsUtils'

const memfs = Memfs.fs.promises

mock.module('node:fs/promises', () => ({ default: memfs }))
mock.module('node:os', () => ({ default: { homedir: () => 'HOME' } }))

beforeEach(async () => {
  vol.fromNestedJSON({
    '/a.txt': 'a.txt',
    '/a.json': '{"a":1}',
    '/file': 'file',
    '/dir': {
      'dir-file': 'dir-file',
    },
  })
  await memfs.symlink('/dir', '/symlink')
  await memfs.symlink('/file', '/symlink-file')
})

afterEach(() => {
  vol.reset()
})

describe('pathExists', () => {
  it('pathExists: none-exist', async () => {
    expect(await fsUtils.pathExists('/none-exist/a.txt')).toBeFalsy()
  })

  it('pathExists: exist', async () => {
    expect(await fsUtils.pathExists('/a.txt')).toBeTruthy()
  })
})

describe('inputFile', () => {
  it('inputFile: none-exist', async () => {
    expect(await fsUtils.inputFile('/none-exist/a.txt', 'utf8')).toBeUndefined()
  })

  it('inputFile: exist', async () => {
    expect(await fsUtils.inputFile('/a.txt', 'utf8')).toEqual('a.txt')
  })
})

describe('outputFile', () => {
  it('outputFile: none-exist', async () => {
    await fsUtils.outputFile('/none-exist/a.txt', 'new')
    expect(await nodeFs.readFile('/none-exist/a.txt', 'utf8')).toEqual('new')
  })

  it('outputFile: exist', async () => {
    await fsUtils.outputFile('/a.txt', 'new')
    expect(await nodeFs.readFile('/a.txt', 'utf8')).toEqual('new')
  })
})

describe('inputJson', () => {
  it('file not exist', async () => {
    expect(await fsUtils.inputJson('/none-exist/a.json')).toBeUndefined()
  })
  it('file exist', async () => {
    expect(await fsUtils.inputJson('/a.json')).toEqual({ a: 1 })
  })
  it('invalid json', async () => {
    await expect(() => fsUtils.inputJson('/a.txt')).toThrow(
      `[inputJson] JSON Parse error: Unexpected identifier "a" from '/a.txt'`,
    )
  })
})

describe('readJson', () => {
  it('file not exist', async () => {
    await expect(() => fsUtils.readJson('/none-exist/a.json')).toThrow(
      `ENOENT: no such file or directory, open '/none-exist/a.json'`,
    )
  })
  it('file exist', async () => {
    expect(await fsUtils.readJson('/a.json')).toEqual({ a: 1 })
  })
  it('invalid json', async () => {
    await expect(() => fsUtils.readJson('/a.txt')).toThrow(
      `[readJson] JSON Parse error: Unexpected identifier "a" from '/a.txt'`,
    )
  })
})

describe('isFile', () => {
  for (const [fixture, expected] of [
    ['/file', true],
    ['/dir', false],
    ['/not-exists', false],
  ] as const) {
    it(fixture, async () => {
      expect(await fsUtils.isFile(fixture)).toEqual(expected)
    })
  }
})

describe('isDir', () => {
  for (const [fixture, expected] of [
    ['/dir', true],
    ['/file', false],
    ['/not-exists', false],
  ] as const) {
    it(fixture, async () => {
      expect(await fsUtils.isDir(fixture)).toEqual(expected)
    })
  }
})

describe('isSymlink', () => {
  for (const [fixture, expected] of [
    ['/symlink', true],
    ['/symlink/', true], // false in node, memfs is different
    ['/symlink-file/', true],
    ['/file', false],
    ['/not-exists', false],
  ] as const) {
    it(fixture, async () => {
      expect(await fsUtils.isSymlink(fixture)).toEqual(expected)
    })
  }
})

describe('expand', () => {
  const buffer = Buffer.from('a')
  const url = new URL('https://a.com')
  for (const [fixture, expected] of [
    ['~', 'HOME'],
    ['~/a', 'HOME/a'],
    ['~/~/a', 'HOME/~/a'],
    ['a/~', 'a/~'],
    ['~/trailing-slash/', 'HOME/trailing-slash/'],
    ['a', 'a'],
    [buffer, buffer],
    [url, url],
    [undefined, undefined],
    [true, true],
  ]) {
    it(String(fixture), () => {
      expect(fsUtils.expand(fixture)).toEqual(expected)
    })
  }
})

describe('cleanPath', () => {
  for (const [fixture, expected] of [
    ['a/b', 'a/b'],
    ['a/b/', 'a/b'],
    ['a//b//', 'a//b'],
    ['a\\b\\', 'a\\b'],
  ]) {
    it(fixture, () => {
      expect(fsUtils.cleanPath(fixture)).toEqual(expected)
    })
  }
})

/*
describe('walk', async () => {
  vol.fromJSON({
    '/dir/a.txt': '',
    '/dir/sub/b.txt': '',
  })

  const entries = []
  for await (const entry of fsUtils.walk('/dir')) {
    entries.push(entry)
  }
  expect(entries).toEqual([
    {
      path: '/dir/sub/b.txt',
      relativePath: 'sub/b.txt',
      dir: '/dir/sub',
      base: 'b.txt',
      name: 'b',
      ext: '.txt',
    },
  ])
})
  */
