import fs from 'node:fs/promises'
import nodePath from 'node:path'

/**
 * Check path exists
 */
async function pathExists(path: string) {
  try {
    await fs.access(path)
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}
/**
 * - file not exists: returns undefined
 */
export async function inputFile(
  path: ReadFileArgs[0],
  options?: ReadFileArgs[1],
) {
  try {
    return await fs.readFile(path, options)
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

/**
 * - Auto create missing dirs
 */
async function outputFile(
  path: WriteFileArgs[0],
  data: WriteFileArgs[1],
  options?: WriteFileArgs[2],
) {
  if (typeof path === 'string') {
    const dir = nodePath.dirname(path)
    await fs.mkdir(dir, { recursive: true })
  }
  return fs.writeFile(path, data, options)
}

// TODO
// emptyDir: readdirSync(dir).forEach(v => fs.rmSync(`${dir}/${v}`, { recursive: true })

/**
 * Walk dir
 */

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await fs.opendir(dir)) {
    console.log({ dir, d })
    const entry = nodePath.join(dir, d.name)
    if (d.isDirectory()) yield* walk(entry)
    else if (d.isFile()) yield entry
  }
}

/**
 * - uses inputFile
 */
async function inputJson(input: ReadFileArgs[0], options?: ReadFileArgs[1]) {
  const text = await inputFile(input, options)
  if (!text) {
    return
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`[inputJson] ${error.message} from '${input}'`)
    }
    throw error
  }
}

/*
 * - uses readFile
 */
async function readJson(input: ReadFileArgs[0], options?: ReadFileArgs[1]) {
  const text = await fs.readFile(input, options)
  try {
    return JSON.parse(text)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`[readJson] ${error.message} from '${input}'`)
    }
    throw error
  }
}

/**
 * isSymlink
 */
async function isSymlink(input: LstatArgs[0]) {
  const stat = await lstatSafe(input)
  return stat ? stat.isSymbolicLink() : false
}

/**
 * isFile
 */
async function isFile(input: LstatArgs[0]) {
  const stat = await lstatSafe(input)
  return stat ? stat.isFile() : false
}

/**
 * isDir
 */
async function isDir(input: LstatArgs[0]) {
  const stat = await lstatSafe(input)
  return stat ? stat.isDirectory() : false
}

/**
 * TS check if error is a Node Error
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

// ignore ENOENT
async function lstatSafe(input: LstatArgs[0]) {
  try {
    return await fs.lstat(input)
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

type WriteFileArgs = Parameters<typeof fs.writeFile>
type ReadFileArgs = Parameters<typeof fs.readFile>
type LstatArgs = Parameters<typeof fs.lstat>

export default {
  ...fs,
  pathExists,
  inputFile,
  outputFile,
  isNodeError,
  readJson,
  inputJson,
  walk,
  isFile,
  isDir,
  isSymlink,
}
