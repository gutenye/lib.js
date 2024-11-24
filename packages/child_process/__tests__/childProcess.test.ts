import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { EventEmitter } from 'node:events'
import { spawnPlus } from '../childProcess'

mock.module('node:child_process', () => ({
  spawn: mock(() => {
    const emitter = new EventEmitter()
    emitter.stderr = new EventEmitter()
    emitter.stdout = new EventEmitter()
    return emitter
  }),
}))

afterEach(() => {
  jest.restoreAllMocks()
})

describe('spawnPlus', () => {
  it('errorPlus', () => {
    const child = spawnPlus('not-found')
    child.on('errorPlus', (error) => {
      expect(error).toEqual({ exitCode: 1, stderr: 'stderr' })
    })
    child.stderr.emit('data', 'stderr')
    child.emit('exit', 1)
    expect.assertions(1)
  })
})
