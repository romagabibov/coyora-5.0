import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { useSiteStore } from '../store';
import { VolunteerForm } from './VolunteerForm';

export function OpportunityModal({ onClose, lang, type }: { onClose: () => void, lang: string, type: 'volunteer' | 'vacancy' | 'internship' }) {
  const store = useSiteStore();
  
  let config;
  const events = store.formSchemas.filter(s => s.category === type);
  
  if (type === 'volunteer') {
    config = store.volunteerFormConfig;
  } else if (type === 'vacancy') {
    config = store.vacanciesFormConfig;
  } else {
    config = store.internshipsFormConfig;
  }

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const t = store.translations[lang as keyof typeof store.translations] || store.translations.en;
  const translate = (key: string | undefined) => {
    if (!key) return '';
    return t[key] || t[key.trim()] || t[key.toLowerCase().replace(/\s+/g, '_')] || key;
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[var(--color-bg)] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border border-[var(--color-border)] relative flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--color-muted)] hover:text-[#fe0000] transition-colors z-10 bg-[var(--color-bg)] p-2 rounded-full shadow-md"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12 flex-1 flex flex-col">
          <div className="mb-8 pr-12">
            <h2 className="text-3xl md:text-5xl font-head uppercase mb-4">
              {translate(config?.title || 'Application')}
            </h2>
            <p className="font-mono text-sm text-[var(--color-muted)] max-w-2xl">
              {translate(config?.description || 'Please fill out the form below to apply.')}
            </p>
          </div>

          <div className="flex-1 w-full min-h-[600px] bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)] relative">
            <AnimatePresence mode="wait">
              {!selectedEventId ? (
                <motion.div 
                  key="event-selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 p-8 overflow-y-auto"
                >
                  <h3 className="font-mono text-sm tracking-[0.2em] text-[#fe0000] uppercase mb-8">
                    {translate('select_event')}
                  </h3>
                  
                  {events.length === 0 ? (
                    <div className="text-[var(--color-muted)] font-mono text-sm">
                      {translate('no_events')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEventId(event.id)}
                          className="text-left p-6 border border-[var(--color-border)] rounded-lg hover:border-[#fe0000] hover:bg-[#fe0000]/5 transition-colors group"
                        >
                          <h4 className="font-bold text-lg mb-2 group-hover:text-[#fe0000] transition-colors">{translate(event.name)}</h4>
                          <div className="text-xs font-mono text-[var(--color-muted)] mb-4">{translate(event.date)}</div>
                          <p className="text-sm text-[var(--color-muted)] line-clamp-3">{translate(event.description)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedEventId(null)}
                      className="flex items-center gap-2 text-xs font-mono text-[var(--color-muted)] hover:text-[#fe0000] transition-colors"
                    >
                      <ArrowLeft size={14} /> {translate('Back to Events')}
                    </button>
                    <span className="text-xs font-mono text-[#fe0000] uppercase tracking-wider">{translate(selectedEvent?.name)}</span>
                  </div>
                  
                  <div className="flex-1 w-full h-full bg-white">
                    {selectedEvent ? (
                      <VolunteerForm 
                        eventId={selectedEvent.id} 
                        eventName={selectedEvent.name} 
                        type={type}
                        fields={selectedEvent.fields}
                        onSuccess={() => setSelectedEventId(null)} 
                        lang={lang} 
                        translate={translate} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] font-mono p-8 text-center bg-[var(--color-bg)]">
                        {translate('form_not_configured')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
