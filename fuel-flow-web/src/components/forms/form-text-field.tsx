import * as React from 'react'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type FieldApi = {
  name: string
  state: {
    value: string
    meta: {
      isTouched: boolean
      isValid: boolean
      errors: ({ message?: string } | undefined)[]
    }
  }
  handleBlur: () => void
  handleChange: (value: string) => void
}

export interface FormTextFieldProps {
  field: FieldApi
  label: string
  type?: 'text' | 'email' | 'tel' | 'password'
  placeholder?: string
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'numeric'
  description?: React.ReactNode
}

/**
 * Reusable form text field with label, input, description, and error display.
 * Reduces duplication across auth forms.
 */
export function FormTextField({
  field,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  description,
}: FormTextFieldProps) {
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid
  const errorId = `${field.name}-error`
  const descriptionId = `${field.name}-description`

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        inputMode={inputMode}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-describedby={
          isInvalid ? errorId : description ? descriptionId : undefined
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  )
}
