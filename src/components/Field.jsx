import { useId, useState } from "react";
import Icon from "./Icon.jsx";

export default function Field({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  type = "text",
  options,
  multiline,
  ...props
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const shared = {
    id,
    name,
    value,
    onChange,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    ...props,
  };
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-control">
        {options ? (
          <select {...shared}>
            <option value="">Choose a topic</option>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : multiline ? (
          <textarea {...shared} rows="5" />
        ) : (
          <input
            {...shared}
            type={type === "password" && visible ? "text" : type}
          />
        )}
        {type === "password" && (
          <button
            type="button"
            className="password-toggle icon-button"
            aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            <Icon name={visible ? "close" : "eye"} size={18} />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
