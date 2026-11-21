import React from 'react';

interface EditorialHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  size?: 'hero' | 'section' | 'subsection';
  className?: string;
}

export const EditorialHeading: React.FC<EditorialHeadingProps> = ({
  as: Tag = 'h2',
  children,
  tone = 'light',
  size = 'section',
  className = '',
}) => {
  const colorClass = tone === 'dark' ? 'text-white' : 'text-[var(--color-ink)]';

  const sizeClass =
    size === 'hero'
      ? 'text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.04] tracking-[-0.025em] font-light'
      : size === 'subsection'
        ? 'text-[clamp(1.375rem,2vw,1.875rem)] leading-[1.2] tracking-[-0.015em] font-normal'
        : 'text-[clamp(2rem,3.4vw,3.15rem)] leading-[1.12] tracking-[-0.022em] font-normal';

  return (
    <Tag className={`font-display text-balance ${sizeClass} ${colorClass} ${className}`}>
      {children}
    </Tag>
  );
};
