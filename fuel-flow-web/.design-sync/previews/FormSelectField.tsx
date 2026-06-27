import { FormSelectField, SelectItem } from 'fuel-flow-web';

// Minimal stand-in for TanStack Form's FieldApi (see FormTextField preview).
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
    <FormSelectField
      field={field('fuelType', 'petrol')}
      label="Fuel type"
      description="Used for pricing and tank mapping."
    >
      <SelectItem value="petrol">Petrol</SelectItem>
      <SelectItem value="diesel">Diesel</SelectItem>
      <SelectItem value="hi-octane">Hi-Octane</SelectItem>
      <SelectItem value="cng">CNG</SelectItem>
    </FormSelectField>
  </div>
);
