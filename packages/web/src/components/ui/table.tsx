import { cn } from '@/lib/cn';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
      {children}
    </thead>
  );
}

export function Th({ children, className }: TableProps) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children, className }: TableProps) {
  return <tbody className={cn('divide-y divide-slate-100', className)}>{children}</tbody>;
}

export function Tr({ children, className }: TableProps) {
  return (
    <tr className={cn('hover:bg-slate-50 transition-colors', className)}>
      {children}
    </tr>
  );
}

export function Td({ children, className }: TableProps) {
  return (
    <td className={cn('px-4 py-3 text-slate-700', className)}>
      {children}
    </td>
  );
}
