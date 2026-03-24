import fs from 'node:fs/promises'
import os from 'node:os'
import nodePath from 'node:path'

/**
 * Check if a path exists.
 * @param path - Path to check
 * @returns true if path exists, false otherwise
 */
async function pathExists(path: string) {
  try {
    await fs.access(cleanPath(path))
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

/**
 * Read a file, returning undefined if it doesn't exist.
 * @param path - File path to read
 * @param options - Read options (encoding, etc.)
 * @returns File contents, or undefined if not found
 */
async function inputFile(path: ReadFileArgs[0], options?: ReadFileArgs[1]) {
  try {
    return await fs.readFile(cleanPath(path), options)
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

/**
 * Write a file, auto-creating missing parent directories.
 * @param rawPath - File path to write
 * @param data - Data to write
 * @param options - Write options (encoding, etc.)
 */
async function outputFile(
  rawPath: WriteFileArgs[0],
  data: WriteFileArgs[1],
  options?: WriteFileArgs[2],
) {
  const path = cleanPath(rawPath)
  if (typeof path === 'string') {
    const dir = nodePath.dirname(path)
    await fs.mkdir(dir, { recursive: true })
  }
  return fs.writeFile(path, data, options)
}

// TODO
// emptyDir: readdirSync(dir).forEach(v => fs.rmSync(`${dir}/${v}`, { recursive: true })

/**
 * Recursively walk a directory, yielding file paths.
 * @param rawDir - Directory to walk
 * @returns Async generator of file paths
 */
async function* walk(rawDir: string): AsyncGenerator<string> {
  const dir = cleanPath(rawDir)
  for await (const d of await fs.opendir(dir)) {
    const entry = nodePath.join(dir, d.name)
    if (d.isDirectory()) yield* walk(entry)
    else if (d.isFile()) yield entry
  }
}

/**
 * Read and parse a JSON file, returning undefined if not found.
 * @param input - File path to read
 * @param options - Read options (encoding, etc.)
 * @returns Parsed JSON, or undefined if not found
 */
async function inputJson(input: ReadFileArgs[0], options?: ReadFileArgs[1]) {
  const text = (await inputFile(cleanPath(input), options || 'utf8')) as
    | string
    | undefined
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

/**
 * Read and parse a JSON file, throwing if not found.
 * @param input - File path to read
 * @param options - Read options (encoding, etc.)
 * @returns Parsed JSON
 */
async function readJson(input: ReadFileArgs[0], options?: ReadFileArgs[1]) {
  const text = (await fs.readFile(
    cleanPath(input),
    options || 'utf8',
  )) as string
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
 * Check if a path is a symbolic link.
 * @param input - Path to check
 * @returns true if symbolic link, false otherwise
 */
async function isSymlink(input: PathLike) {
  const stat = await lstatSafe(input)
  return stat ? stat.isSymbolicLink() : false
}

/**
 * Check if a path is a regular file.
 * @param input - Path to check
 * @returns true if regular file, false otherwise
 */
async function isFile(input: PathLike) {
  const stat = await lstatSafe(input)
  return stat ? stat.isFile() : false
}

/**
 * Check if a path is a directory.
 * @param input - Path to check
 * @returns true if directory, false otherwise
 */
async function isDir(input: PathLike) {
  const stat = await lstatSafe(input)
  return stat ? stat.isDirectory() : false
}

/**
 * Type guard for Node.js errors with an error code.
 * @param error - Error to check
 * @returns true if error is a NodeJS.ErrnoException
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

/**
 * lstat that returns undefined instead of throwing on ENOENT.
 * @param input - Path to stat
 * @returns File stats, or undefined if not found
 */
async function lstatSafe(input: PathLike) {
  try {
    return await fs.lstat(cleanPath(input))
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

/**
 * Expand ~ to the home directory.
 * @param path - Path to expand
 * @returns Expanded path
 */
function expandHome(path: any) {
  if (!path || typeof path !== 'string') {
    return path
  }
  const home = os.homedir()
  if (path === '~') {
    return home
  }
  if (path.startsWith('~/') || path.startsWith('~\\')) {
    return nodePath.join(os.homedir(), path.slice(2))
  }
  return path
}

/**
 * Resolve a path to absolute, expanding ~ to home directory.
 * @param path - Path to resolve
 * @returns Absolute path
 */
function expandAbs(path: any) {
  return nodePath.resolve(expandHome(path))
}

/**
 * Expand ~ and remove trailing slashes.
 * @param path - Path to clean
 * @returns Cleaned path
 */
function cleanPath(path: any) {
  return removeTrailingSlash(expandHome(path))
}

/**
 * Remove trailing slashes from a path.
 * @param path - Path to clean
 * @returns Path without trailing slashes
 */
function removeTrailingSlash(path: any) {
  if (!path || typeof path !== 'string') {
    return path
  }
  return path.replace(/[\\/]+$/, '')
}

/**
 * Remove a file or directory recursively.
 * @param path - Path to remove
 */
async function remove(path: PathLike) {
  return fs.rm(cleanPath(path), { recursive: true, force: true })
}

/**
 * Copy a file or directory recursively, creating missing dest directories.
 * @param rawSrc - Source path
 * @param rawDest - Destination path
 */
async function copy(rawSrc: PathLike, rawDest: PathLike) {
  const dest = cleanPath(rawDest)
  await makeMissingDirs(dest)
  return fs.cp(cleanPath(rawSrc), dest, { recursive: true })
}

/**
 * Copy a single file, creating missing dest directories.
 * @param rawSrc - Source file path
 * @param rawDest - Destination file path
 */
async function copyFile(rawSrc: PathLike, rawDest: PathLike) {
  const src = cleanPath(rawSrc)
  const dest = cleanPath(rawDest)
  await makeMissingDirs(dest)
  try {
    return await fs.cp(src, dest)
  } catch (error) {
    // memfs doesn't support fs.cp
    if (error instanceof Error && error.message === 'Not implemented') {
      await fs.writeFile(dest, await fs.readFile(src))
      const { mode } = await fs.stat(src)
      await fs.chmod(dest, mode)
      return
    }
    throw error
  }
}

/**
 * Move/rename a file or directory, creating missing dest directories.
 * @param rawSrc - Source path
 * @param rawDest - Destination path
 */
async function move(rawSrc: PathLike, rawDest: PathLike) {
  const dest = cleanPath(rawDest)
  await makeMissingDirs(dest)
  return fs.rename(cleanPath(rawSrc), dest)
}

/**
 * Create parent directories for a path.
 * @param rawPath - Path whose parent dirs to create
 */
async function makeMissingDirs(rawPath: PathLike) {
  if (typeof rawPath !== 'string') {
    return
  }
  const path = cleanPath(rawPath)
  const parent = nodePath.dirname(path)
  return mkdir(parent)
}

/**
 * Create a directory recursively.
 * @param path - Directory path to create
 */
async function mkdir(path: PathLike) {
  return fs.mkdir(path, { recursive: true })
}

/**
 * Ensure a directory exists and is empty, creating it if missing.
 * @param path - Directory path
 */
async function ensureDirEmpty(path: string) {
  const cleaned = cleanPath(path)
  try {
    const files = await fs.readdir(cleaned)
    if (files.length > 0) {
      throw `Project directory is not empty: '${path}'`
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      await mkdir(cleaned)
      return
    }
    throw error
  }
}

type WriteFileArgs = Parameters<typeof fs.writeFile>
type ReadFileArgs = Parameters<typeof fs.readFile>
type PathLike = Parameters<typeof fs.lstat>[0]

export default {
  ...fs,
  pathExists,
  expandHome,
  expandAbs,
  cleanPath,
  inputFile,
  outputFile,
  isNodeError,
  readJson,
  inputJson,
  walk,
  isFile,
  isDir,
  isSymlink,
  remove,
  copy,
  copyFile,
  move,
  mkdir,
  ensureDirEmpty,
}
