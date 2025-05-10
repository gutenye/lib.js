import fs from 'node:fs'

const path = '.github-cache.json'

class Cache {
  getId(key: string) {
    return this.#loadCache()[key]
  }

  setId(key: string, id: string) {
    const cache = this.#loadCache()
    cache[key] = id
    this.#saveCache(cache)
  }

  #loadCache() {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {}
  }

  #saveCache(cache: any) {
    fs.writeFileSync(path, JSON.stringify(cache, null, 2))
  }
}

export const cache = new Cache()
