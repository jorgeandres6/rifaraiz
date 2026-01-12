import React from 'react';

export type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

const Toasts: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`max-w-sm w-full px-4 py-3 rounded shadow-lg border ${t.type === 'error' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-800 text-white border-gray-700'}`}
        >
          <div className="flex items-start justify-between">
            <div className="text-sm leading-tight">{t.message}</div>
            <button onClick={() => onRemove(t.id)} className="ml-3 text-xl leading-none font-bold">×</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toasts;
