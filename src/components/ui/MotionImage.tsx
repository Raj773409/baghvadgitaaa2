import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

interface MotionImageProps {
  src: string;
  alt: string;
  caption?: string;
  aspectClass?: string;
  className?: string;
  priority?: boolean;
}

export const MotionImage: React.FC<MotionImageProps> = ({
  src,
  alt,
  caption,
  aspectClass = 'aspect-[16/9]',
  className = '',
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={`m-0 ${className}`}>
      <div
        className={`relative overflow-hidden bg-[var(--color-surface)] ${aspectClass} group`}
      >
        {!failed ? (
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-border)]">
            <Landmark className="w-8 h-8 text-[var(--color-bronze)] mb-3" aria-hidden="true" />
            <span className="text-xs text-[var(--color-ink)] max-w-xs">{alt}</span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
