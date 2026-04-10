import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function Toast({ message, isVisible, onClose, isError = false }: { message: string, isVisible: boolean, onClose: () => void, isError?: boolean }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-mono text-xs tracking-widest uppercase border ${isError ? 'bg-[var(--color-bg)] border-red-500 text-red-500' : 'bg-green-500 border-green-500 text-white'}`}
        >
          {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
