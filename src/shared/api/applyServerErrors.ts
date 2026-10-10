import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiErrorClass } from './types'

export interface AppliedServerErrors {
  fieldErrorsSet: boolean
  formError: string | null
  hasUnderscoreError: boolean
}

export function applyServerErrors<T extends FieldValues>(
  error: ApiErrorClass,
  setError: UseFormSetError<T>,
  knownFields: readonly Path<T>[],
): AppliedServerErrors {
  if (!error.errors) {
    return { fieldErrorsSet: false, formError: null, hasUnderscoreError: false }
  }

  let fieldErrorsSet = false
  let formError: string | null = null
  let hasUnderscoreError = false
  let isFirst = true

  for (const [key, value] of Object.entries(error.errors)) {
    let message: string | undefined

    if (typeof value === 'string') {
      message = value
    } else if (Array.isArray(value) && value.length > 0) {
      message = value[0]
    } else {
      continue
    }

    if (key !== '_' && knownFields.includes(key as Path<T>)) {
      setError(key as Path<T>, { type: 'server', message }, { shouldFocus: isFirst })
      fieldErrorsSet = true
      isFirst = false
    } else {
      if (formError === null) {
        formError = message
      }
      if (key === '_') {
        hasUnderscoreError = true
      }
    }
  }

  return { fieldErrorsSet, formError, hasUnderscoreError }
}

