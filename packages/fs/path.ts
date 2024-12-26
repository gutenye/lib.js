import nodePath from 'node:path'
import fs from './fs'

// suffix name
// a.js -> a-suffix.js
export function suffix(path: string, suffix: string) {
  const { dir, name, ext } = nodePath.parse(path)
  return nodePath.join(dir, `${name}${suffix}${ext}`)
}

/**
 * If path exists, return a new path with a number appended to it.
 */
export async function genUniquePath(path: string): Promise<string> {
  const { dir, name, ext } = nodePath.parse(path)
  let newPath = path
  let index = 1
  while (await fs.pathExists(newPath)) {
    newPath = nodePath.join(dir, `${name} (${index})${ext}`)
    index++
  }
  return newPath
}

/*
 * Check path has ext
 */
export function hasExt(path: string, exts: string[]) {
  const ext = nodePath.extname(path).slice(1)
  return exts.includes(ext)
}

export default {
  ...nodePath,
  suffix,
  genUniquePath,
  hasExt,
}
