import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let _id = 0;

const TYPE_STYLES = {
  success: 'bg-green-600',
  warn: 'bg-amber-500',
  danger: 'bg-red-600',
  info: 'bg-nlg-text',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${TYPE_STYLES[t.type] || TYPE_STYLES.success} text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm animate-[fadeIn_.2s_ease] `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
