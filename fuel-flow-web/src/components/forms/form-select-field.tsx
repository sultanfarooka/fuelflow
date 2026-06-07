import * as React from 'react'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export interface FormSelectFieldProps {
  field: FieldApi
  label: string
  placeholder?: string
  description?: React.ReactNode
  disabled?: boolean
  children: React.ReactNode
}

export function FormSelectField({
  field,
  label,
  placeholder,
  description,
  disabled,
  children,
}: FormSelectFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const errorId = `${field.name}-error`
  const descriptionId = `${field.name}-description`

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        value={field.state.value}
        onValueChange={(v) => field.handleChange(v)}
        disabled={disabled}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          aria-describedby={
            isInvalid ? errorId : description ? descriptionId : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  )
}
