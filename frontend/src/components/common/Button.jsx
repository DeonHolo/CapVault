import { ArrowClockwise } from '@phosphor-icons/react';

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, loading = false, className = '', ...props }) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading ? <ArrowClockwise className="animate-spin" weight="regular" /> : Icon ? <Icon weight="regular" /> : null}
      <span>{children}</span>
    </button>
  );
}
