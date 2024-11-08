/*
From: https://github.com/lodash/lodash/tree/es
Features
	- compatible with lodash
*/

/* new methods */

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

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (!(value !== null && typeof value === 'object')) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  if (proto === null) {
    return true
  }
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
    proto.constructor
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) ===
      Function.prototype.toString.call(Object)
  )
}
