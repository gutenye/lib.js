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

export function mapKeysDeep(input: unknown, transformKey: (key: string) => string) {
  if (Array.isArray(input)) {
    return input.map(v => mapKeysDeep(v, transformKey));
  } else if (input && typeof input === 'object' && input.constructor === Object) {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [transformKey(k), mapKeysDeep(v, transformKey)])
    );
  }
  return input;
}