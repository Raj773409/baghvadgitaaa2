import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'bronze-pill' | 'ghost-dark';

interface BaseProps {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

type AnchorButtonProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type NativeButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-ink)] text-white border border-[var(--color-ink)] hover:bg-[var(--color-olive)] hover:border-[var(--color-olive)] rounded-full',
  secondary:
    'bg-transparent text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] rounded-full',
  'bronze-pill':
    'bg-[var(--color-bronze-light)] text-[var(--color-ink)] border border-[var(--color-bronze-light)] hover:bg-white hover:border-white rounded-full',
  'ghost-dark':
    'bg-white/[0.06] text-white border border-white/40 hover:bg-white/15 hover:border-white rounded-full',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2.5 min-h-[44px] px-6 py-2.5 text-sm font-medium tracking-[0.02em] whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer';

export const Button: React.FC<AnchorButtonProps | NativeButtonProps> = (props) => {
  const { variant = 'primary', className = '', children, ...rest } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorProps } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? 'button'}
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
};
