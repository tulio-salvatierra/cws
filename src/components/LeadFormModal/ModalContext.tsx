import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import LeadFormModal from './LeadFormModal';

interface ModalContextValue {
  openLeadForm: () => void;
  closeLeadForm: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openLeadForm = useCallback(() => setIsOpen(true), []);
  const closeLeadForm = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ openLeadForm, closeLeadForm }), [openLeadForm, closeLeadForm]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <LeadFormModal 
        isOpen={isOpen}
        onClose={closeLeadForm}
        onSubmit={(data) => {
          // In a future iteration we can POST to an API or analytics here
          console.log('Lead submitted', data);
          setToastMessage('Thanks! We\'ll contact you shortly.');
        }}
      />
      {/* Toast Notification */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        role="status"
        aria-live="polite"
      >
        {toastMessage && (
          <div className="px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-700 text-white shadow-xl backdrop-blur-md">
            <span className="text-sm">{toastMessage}</span>
          </div>
        )}
      </div>
    </ModalContext.Provider>
  );
}


