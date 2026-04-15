import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSiteStore } from '../store';
import { VolunteerForm } from './VolunteerForm';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function StandaloneForm() {
  const { type, projectName } = useParams<{ type: 'volunteer' | 'vacancy' | 'internship', projectName: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const store = useSiteStore();

  // Берем переводы из стора (по дефолту ставлю ru, но можешь поменять логику)
  const lang = 'ru'; 
  const t = store.translations[lang as keyof typeof store.translations] || store.translations.en || {};
  const translate = (key: string | undefined) => {
    if (!key) return '';
    return t[key] || t[key.trim()] || t[key.toLowerCase().replace(/\s+/g, '_')] || key;
  };
  
  useEffect(() => {
    const fetchSchema = async () => {
      if (!projectName) return;
      try {
        const decodedName = decodeURIComponent(projectName);
        
        // 1. Сначала пробуем найти документ по ID (это для новых коротких ссылок)
        const docRef = doc(db, 'formSchemas', decodedName);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().category === type) {
          setSchema({ id: docSnap.id, ...docSnap.data() });
        } else {
          // 2. Фолбэк для старых длинных ссылок (ищем по полному имени)
          const q = query(
            collection(db, 'formSchemas'), 
            where('category', '==', type),
            where('name', '==', decodedName)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setSchema({ id: firstDoc.id, ...firstDoc.data() });
          }
        }
      } catch (err) {
        console.error("Failed to fetch schema", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, [projectName, type]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fe0000]"></div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] font-mono">
        Form not found.
      </div>
    );
  }

  // Достаем базовые настройки для типа формы (если вдруг в самой схеме нет описания)
  let config;
  if (type === 'volunteer') config = store.volunteerFormConfig;
  else if (type === 'vacancy') config = store.vacanciesFormConfig;
  else config = store.internshipsFormConfig;

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)] flex justify-center items-center p-0 md:p-8">
      {/* Обертка формы: на мобилках фуллскрин, на десктопе красивый блок */}
      <div className="w-full h-[100dvh] md:h-[90vh] md:max-w-4xl flex flex-col bg-[var(--color-bg)] border-0 md:border border-[var(--color-border)] rounded-none md:rounded-xl shadow-2xl overflow-hidden relative">
        
        {/* Шапка с названием формы и описанием */}
        <div className="p-6 md:p-12 border-b border-[var(--color-border)] shrink-0 z-10 bg-[var(--color-bg)]">
          <h2 className="text-3xl md:text-5xl font-head uppercase mb-3">
            {schema.name || translate(config?.title || 'Application')}
          </h2>
          <p className="font-mono text-sm text-[var(--color-muted)] leading-relaxed max-w-2xl">
            {schema.description || translate(config?.description || 'Please fill out the form below.')}
          </p>
        </div>
        
        {/* Сам контент формы */}
        <div className="flex-1 relative bg-[var(--color-bg)]">
          <VolunteerForm 
            eventId={schema.id}
            eventName={schema.name}
            type={type || 'volunteer'}
            fields={schema.fields}
            onSuccess={() => navigate('/')}
            lang={lang}
            translate={translate}
          />
        </div>

      </div>
    </div>
  );
}