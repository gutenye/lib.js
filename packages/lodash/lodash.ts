/*
Features
	- drop-in replacment of lodash, compatible with lodash
*/

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
