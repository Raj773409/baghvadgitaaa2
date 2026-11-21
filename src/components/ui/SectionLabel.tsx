import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  tone = 'light',
  className = '',
}) => {
  const colorClass =
    tone === 'dark' ? 'text-[var(--color-bronze-light)]' : 'text-[var(--color-bronze)]';

  return (
    <p
      className={`text-xs font-medium tracking-[0.14em] uppercase ${colorClass} ${className}`}
    >
      {children}
    </p>
  );
};
