import "./Form.css";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  defaultValue,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  helper,
  autoComplete
}) {
  const inputProps = {
    className: "form-input",
    name,
    type,
    placeholder,
    required,
    min,
    step,
    autoComplete
  };

  if (onChange) inputProps.onChange = onChange;
  if (value !== undefined) inputProps.value = value;
  if (defaultValue !== undefined) inputProps.defaultValue = defaultValue;

  return (
    <label className="form-field">
      {label && <span className="form-label">{label}</span>}
      <input {...inputProps} />
      {helper && <span className="form-helper">{helper}</span>}
    </label>
  );
}
