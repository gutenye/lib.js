// bun add zod-validation-error
// throw ZodValidationError: `Validation error: Required at "email"`

import type { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

export function zodParse<T>(schema: z.ZodSchema, input: unknown) {
  const { error, data } = schema.safeParse(input)
  if (error) {
    throw fromZodError(error, { maxIssuesInMessage: 1 })
  }
  return data as T
}
