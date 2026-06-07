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
  size?: 'default' | 'lg'
  /** Called on blur before handleBlur. If it returns a different value, the field is updated first. */
  onNormalize?: (value: string) => string
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
  size = 'default',
  onNormalize,
}: FormTextFieldProps) {
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid
  const errorId = `${field.name}-error`
  const descriptionId = `${field.name}-description`

  const handleBlur = () => {
    if (onNormalize) {
      const normalized = onNormalize(field.state.value)
      if (normalized !== field.state.value) field.handleChange(normalized)
    }
    field.handleBlur()
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        size={size}
        inputMode={inputMode}
        value={field.state.value}
        onBlur={handleBlur}
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
