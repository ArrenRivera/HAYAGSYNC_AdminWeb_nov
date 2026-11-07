import React from 'react';

export default function ProfileAvatar({ src, name, className = '' }) {
  const isPlaceholderSource = !src || src.includes('unsplash.com');

  if (!isPlaceholderSource) {
    return <img src={src} alt={name || 'Profile'} className={className} />;
  }

  return (
    <span
      role="img"
      aria-label={`${name || 'Profile'} default avatar`}
      className={`inline-flex items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-700 ${className}`}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
        <circle cx="32" cy="32" r="32" fill="#dbe2ea" className="dark:fill-slate-700" />
        <circle cx="32" cy="24" r="12" fill="#8b98a8" className="dark:fill-slate-400" />
        <path d="M10 60c1.8-13.2 10.1-20 22-20s20.2 6.8 22 20" fill="#8b98a8" className="dark:fill-slate-400" />
      </svg>
    </span>
  );
}
