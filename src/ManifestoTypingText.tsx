import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useSiteStore } from './store';

export default function ManifestoTypingText({ text = "manifesto_text" }: { text?: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const { translations } = useSiteStore();
  
  // Get current language from localStorage or default to 'en'
  const lang = (localStorage.getItem('coyora-site-storage') ? JSON.parse(localStorage.getItem('coyora-site-storage')!).state?.lang : 'en') || 'en';
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  const translate = (key: string | undefined) => {
    if (!key) return '';
    return t[key] || t[key.trim()] || t[key.toLowerCase().replace(/\s+/g, '_')] || key;
  };

  const defaultManifesto = "We reject the ordinary.\nWe build the void between\nphysical reality & digital illusion.";
  const fullText = translate(text) === text ? defaultManifesto : translate(text);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (!isInView) {
      setDisplayedText('');
      return;
    }

    const typeText = async () => {
      setDisplayedText('');
      for (let i = 1; i <= fullText.length; i++) {
        if (!isMounted) return;
        setDisplayedText(fullText.slice(0, i));
        await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
      }
    };

    typeText();

    return () => {
      isMounted = false;
    };
  }, [isInView, fullText]);

  return (
    <div ref={ref} className="min-h-[200px] flex items-center justify-center">
      <p className="font-head text-3xl md:text-5xl lg:text-7xl uppercase leading-[1.1] tracking-tighter text-[var(--color-text)] whitespace-pre-line">
        {displayedText}
        <span 
          className="inline-block w-4 h-8 md:w-6 md:h-12 lg:w-8 lg:h-16 bg-[#fe0000] ml-2 align-middle" 
          style={{ opacity: showCursor ? 1 : 0 }} 
        />
      </p>
    </div>
  );
}
