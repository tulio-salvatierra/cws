import { useEffect, useRef } from 'react';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; email: string; phone: string }) => void;
}

export default function LeadFormModal({ isOpen, onClose, onSubmit }: LeadFormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleEsc);
      }
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('tel') || ''),
    };
    onSubmit?.({ name: payload.name, email: payload.email, phone: payload.phone });
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal={true}
      aria-labelledby="lead-form-title"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[101]" 
        onClick={onClose} 
      />
      <div 
        ref={dialogRef}
        className="relative z-[102] w-full max-w-md mx-4 rounded-2xl bg-zinc-900 border border-zinc-700 p-6 text-white shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="lead-form-title" className="text-2xl font-main font-black text-orange-500">Get Your Free Quote</h2>
            <p className="text-sm text-zinc-300 mt-1">Tell us how to reach you and we’ll follow up shortly.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-200">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              inputMode="text"
              className="mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-200">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className="mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label htmlFor="tel" className="block text-sm font-medium text-zinc-200">Phone</label>
            <input
              id="tel"
              name="tel"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9()+\-\s]*"
              className="mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button 
            type="submit"
            className="w-full btn-bounce"
          >
            <div className="btn-bounce-bg"></div>
            <div className="btn-bounce-text__wrap">
              <span className="btn-bounce-text">Request Callback</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}


