export function FormField({ label, helper, error, children, className = '' }) {
  return (
    <label className={`form-field ${className}`.trim()}>
      <span className="form-label">{label}</span>
      {children}
      {helper ? <span className="form-helper">{helper}</span> : null}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}
