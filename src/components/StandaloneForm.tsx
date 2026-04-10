import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSiteStore } from '../store';
import { VolunteerForm } from './VolunteerForm';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LoadingScreen } from '../LoadingScreen';

export function StandaloneForm() {
  const { type, schemaId } = useParams<{ type: 'volunteer' | 'vacancy' | 'internship', schemaId: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSchema = async () => {
      if (!schemaId) return;
      try {
        const docRef = doc(db, 'formSchemas', schemaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().category === type) {
          setSchema({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Failed to fetch schema", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, [schemaId, type]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#fe0000] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">Loading Form...</span>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="text-center font-mono">
          <h1 className="text-2xl mb-4">Form Not Found</h1>
          <button onClick={() => navigate('/')} className="text-[#fe0000] hover:underline">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <h1 className="text-3xl font-head uppercase mb-2">{schema.name}</h1>
          {schema.description && (
            <p className="font-mono text-sm text-[var(--color-muted)]">{schema.description}</p>
          )}
        </div>
        <div className="p-8">
          <VolunteerForm 
            eventId={schema.id}
            eventName={schema.name}
            type={type}
            fields={schema.fields || []}
            onSuccess={() => {
              // Optional: show a success state or redirect
            }}
            lang="en"
            translate={(key) => key || ''}
          />
        </div>
      </motion.div>
    </div>
  );
}
