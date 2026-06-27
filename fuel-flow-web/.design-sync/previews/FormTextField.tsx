import { FormTextField } from 'fuel-flow-web';

// Minimal stand-in for TanStack Form's FieldApi — FormTextField only reads
// field.name, field.state.value, and field.state.meta. No live form needed.
const field = (name, value, errors) => ({
  name,
  state: {
    value,
    meta: {
      isTouched: Boolean(errors && errors.length),
      isValid: !(errors && errors.length),
      errors: errors || [],
    },
  },
  handleBlur: () => {},
  handleChange: () => {},
});

export const Default = () => (
  <div className="max-w-sm p-4">
    <FormTextField
      field={field('email', 'owner@example.com')}
      label="Email"
      type="email"
      description="We'll send a verification link."
    />
  </div>
);

export const Invalid = () => (
  <div className="max-w-sm p-4">
    <FormTextField
      field={field('phone', '03', [{ message: 'Enter a valid +92 phone number.' }])}
      label="Phone"
      type="tel"
    />
  </div>
);
