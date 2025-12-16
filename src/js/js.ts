export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function findAsync<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
): Promise<T | undefined> {
  for (const [index, item] of items.entries()) {
    if (await predicate(item, index)) {
      return item
    }
  }
  return
}

/* Lodash methods */

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isPlainArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value) && value.length === Object.keys(value).length
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: any): o is Record<PropertyKey, unknown> {
  if (Object.prototype.toString.call(o) !== '[object Object]') {
    return false
  }

  // If has no constructor
  const ctor = o.constructor
  if (ctor === undefined) {
    return true
  }

  // If has modified prototype
  const prot = ctor.prototype
  if (Object.prototype.toString.call(prot) !== '[object Object]') {
    return false
  }

  // If constructor does not have an Object-specific method
  if (!Object.hasOwn(prot, 'isPrototypeOf')) {
    return false
  }

  // Handles Objects created by Object.create(<arbitrary prototype>)
  if (Object.getPrototypeOf(o) !== Object.prototype) {
    return false
  }

  // Most likely a plain Object
  return true
}

export function mapKeysDeep(
  input: unknown,
  transformKey: (key: string) => string,
) {
  if (Array.isArray(input)) {
    return input.map((v) => mapKeysDeep(v, transformKey))
  } else if (
    input &&
    typeof input === 'object' &&
    input.constructor === Object
  ) {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [
        transformKey(k),
        mapKeysDeep(v, transformKey),
      ]),
    )
  }
  return input
}
