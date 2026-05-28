export function FormField({ label, helper, error, children }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {children}
      {helper ? <span className="form-helper">{helper}</span> : null}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}
