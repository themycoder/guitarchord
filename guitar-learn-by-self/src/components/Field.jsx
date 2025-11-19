export function Field({ label, htmlFor, children, hint, error }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
