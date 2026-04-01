import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, action }: Props) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
