import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import nodeFs from 'node:fs/promises'
import Memfs, { vol } from 'memfs'
import fsUtils, { cleanPath } from '../fs'

const memfs = Memfs.fs.promises

mock.module('node:fs/promises', () => ({ default: memfs }))
mock.module('node:os', () => ({ default: { homedir: () => '/HOME' } }))

beforeEach(async () => {
  vol.fromNestedJSON({
    '/file': 'file',
    '/a.json': '{"a":1}',
    '/dir': {
      file: 'dir/file',
    },
    '/HOME': {
      file: 'HOME/file',
      dir: {},
    },
  })
  await memfs.symlink('/dir', '/symlink')
  await memfs.symlink('/file', '/symlink-file')
  await memfs.symlink('/dir', '/HOME/symlink')
})

afterEach(() => {
  vol.reset()
})

describe('pathExists', () => {
  for (const [fixture, expected] of [
    ['/file', true],
    ['/dir', true],
    ['~/file/', true],
    ['/none-exist', false],
  ] as const) {
    it(fixture, async () => {
      expect(await fsUtils.pathExists(fixture)).toEqual(expected)
    })
  }
})

describe('inputFile', () => {
  for (const [fixture, expected] of [
    ['/file', 'file'],
    [
      '/dir',
      new Error("EISDIR: illegal operation on a directory, open '/dir'"),
    ],
    ['~/file/', 'HOME/file'],
    ['/none-exist', undefined],
  ] as const) {
    it(fixture, async () => {
      if (expected instanceof Error) {
        await expect(fsUtils.inputFile(fixture, 'utf8')).rejects.toThrow(
          expected.message,
        )
      } else {
        const received = await fsUtils.inputFile(fixture, 'utf8')
        expect<typeof received>(received).toEqual(expected)
      }
    })
  }
})

describe('outputFile', () => {
  for (const [fixture, expected] of [
    ['/file', 'file'],
    [
      '/dir',
      new Error("EISDIR: illegal operation on a directory, open '/dir'"),
    ],
    ['~/file/', 'HOME/file'],
    ['/none-exist-dir/a', undefined],
  ] as const) {
    it(fixture, async () => {
      if (expected instanceof Error) {
        await expect(fsUtils.outputFile(fixture, 'utf8')).rejects.toThrow(
          expected.message,
        )
      } else {
        await fsUtils.outputFile(fixture, 'new')
        expect(await nodeFs.readFile(cleanPath(fixture), 'utf8')).toEqual('new')
      }
    })
  }
})

describe('inputJson', () => {
  it('file not exist', async () => {
    expect(await fsUtils.inputJson('/none-exist/a.json')).toBeUndefined()
  })
  it('file exist', async () => {
    expect(await fsUtils.inputJson('/a.json')).toEqual({ a: 1 })
  })
  it('invalid json', async () => {
    await expect(fsUtils.inputJson('/file')).rejects.toThrow(
      `[inputJson] JSON Parse error: Unexpected identifier "file" from '/file'`,
    )
  })
})

describe('readJson', () => {
  it('file not exist', async () => {
    await expect(fsUtils.readJson('/none-exist/a.json')).rejects.toThrow(
      `ENOENT: no such file or directory, open '/none-exist/a.json'`,
    )
  })
  it('file exist', async () => {
    expect(await fsUtils.readJson('/a.json')).toEqual({ a: 1 })
  })
  it('invalid json', async () => {
    await expect(fsUtils.readJson('/file')).rejects.toThrow(
      `[readJson] JSON Parse error: Unexpected identifier "file" from '/file'`,
    )
  })
})

describe('isFile', () => {
  for (const [fixture, expected] of [
    ['/file', true],
    ['~/file/', true],
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
    ['~/dir/', true],
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
    ['~/symlink/', true],
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
    ['~', '/HOME'],
    ['~/a', '/HOME/a'],
    ['~/~/a', '/HOME/~/a'],
    ['a/~', 'a/~'],
    ['~/trailing-slash/', '/HOME/trailing-slash/'],
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

describe('remove', () => {
  for (const [fixture] of [['/file'], ['/dir'], ['/not-exist']]) {
    it(fixture, async () => {
      expect(await fsUtils.remove(fixture)).toBeUndefined()
    })
  }
})

/*
describe('walk', async () => {
  vol.fromJSON({
    '/dir/file': '',
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
