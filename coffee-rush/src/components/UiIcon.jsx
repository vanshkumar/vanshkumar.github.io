export function UiIcon({ name }) {
  return <span className={`ui-icon ui-icon-${name}`} aria-hidden="true" />;
}

export function IconButton({
  icon,
  label,
  className = '',
  children,
  ...buttonProps
}) {
  return (
    <button
      {...buttonProps}
      className={`icon-action ${className}`.trim()}
      type="button"
      title={label}
      aria-label={label}
    >
      <UiIcon name={icon} />
      {children && <span className="icon-action-text">{children}</span>}
    </button>
  );
}
