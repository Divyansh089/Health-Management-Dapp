import "./Form.css";

export default function SelectField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = "Select...",
  required = false,
  helper
}) {
  const selectProps = {
    className: "form-input",
    name,
    required
  };

  if (onChange) selectProps.onChange = onChange;
  if (value !== undefined) selectProps.value = value;
  if (defaultValue !== undefined) selectProps.defaultValue = defaultValue;

  return (
    <label className="form-field">
      {label && <span className="form-label">{label}</span>}
      <select {...selectProps}>
        <option value="">{placeholder}</option>
        {options.map((option) =>
          typeof option === "object" ? (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ) : (
            <option key={option} value={option}>
              {option}
            </option>
          )
        )}
      </select>
      {helper && <span className="form-helper">{helper}</span>}
    </label>
  );
}
