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
 * TS check if error is a Node Error
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

type WriteFileArgs = Parameters<typeof fs.writeFile>
type ReadFileArgs = Parameters<typeof fs.readFile>

export default {
  ...fs,
  pathExists,
  inputFile,
  outputFile,
  isNodeError,
}
