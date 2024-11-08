/*
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
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
